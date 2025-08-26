import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchPreRegistrationCourses,
  fetchMyPreRegisteredCourses,
  addPreRegistration,
  removePreRegistration,
  fetchCreditInfo,
  fetchPreRegistrationCount
} from '../api/courseApi';
import { fetchClassrooms } from '../api/classroomApi';
import '../styles/PreRegistrationPage.css';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

function PreRegistrationPage() {
  const { user } = useAuth();
  const studentId = user?.userId;
  const [registeredClasses, setRegisteredClasses] = useState([]);
  const [preset, setPreset] = useState(1);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [myCourses, setMyCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [creditInfo, setCreditInfo] = useState(null);
  const minCredit = 15;
  const maxCredit = 21;
  const [isTimetableOpen, setIsTimetableOpen] = useState(false);
  const [registrationCounts, setRegistrationCounts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;


  // 시간 중복 체크 함수: 같은 요일에 두 강의의 시간이 겹치면 true 반환
  const isTimeConflict = (course1, course2) => {
    if (course1.dayOfWeek.some(day => course2.dayOfWeek.includes(day))) {
      const [s1Hour, s1Min] = course1.startTime.split(':').map(Number);
      const [e1Hour, e1Min] = course1.endTime.split(':').map(Number);
      const [s2Hour, s2Min] = course2.startTime.split(':').map(Number);
      const [e2Hour, e2Min] = course2.endTime.split(':').map(Number);
      const start1 = s1Hour * 60 + s1Min,
            end1 = e1Hour * 60 + e1Min;
      const start2 = s2Hour * 60 + s2Min,
            end2 = e2Hour * 60 + s2Min; // (혹은 e2Hour * 60 + e2Min)
      return start1 < end2 && end1 > start2;
    }
    return false;
  };

  //웹소켓
  useEffect(() => {
    const socket = new SockJS('http://localhost:8080/ws');
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("✅ WebSocket 연결됨");
  
        stompClient.subscribe('/topic/registrationCounts', (message) => {
          const counts = JSON.parse(message.body);
          console.log("📥 실시간 신청 인원 업데이트:", counts);
          setRegistrationCounts(counts);
        });
      },
      onStompError: (frame) => {
        console.error('❌ WebSocket STOMP 오류:', frame);
      }
    });
  
    stompClient.activate();
  
    return () => {
      if (stompClient.connected) {
        stompClient.deactivate();
      }
    };
  }, []);
  

  useEffect(() => {
    console.log("🧪 availableCourses:", availableCourses);
    availableCourses.forEach(c => console.log(`${c.className}: ${c.courseType}`));
  }, [availableCourses]);

  useEffect(() => {
    if (studentId) {
      Promise.all([
        fetchPreRegistrationCourses(),
        fetchMyPreRegisteredCourses(studentId, preset),
        fetchCreditInfo(studentId),
        fetchClassrooms(studentId),
        fetchPreRegistrationCount(),
      ])
        .then(([courses, myCourses, creditInfo, registered, counts]) => {
          console.log("✅ counts 확인:", counts);
          setAvailableCourses(courses);
          setMyCourses(myCourses);
          setCreditInfo(creditInfo);
          setRegisteredClasses(registered);
          setRegistrationCounts(counts);
        })
        .catch(err => console.error("데이터 불러오기 실패:", err));
    }
  }, [studentId, preset]);

  const registeredClassIds = useMemo(() => registeredClasses.map(cls => cls.classId), [registeredClasses]);

  const filteredCourses = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase();
    return availableCourses
      .filter(course =>
        (course.className?.toLowerCase()?.includes(lowerSearch) ?? false) ||
        (course.professor?.toLowerCase()?.includes(lowerSearch) ?? false)
      )
      .filter(course => !registeredClassIds.includes(course.classId));
  }, [availableCourses, searchTerm, registeredClassIds]);

  const paginatedCourses = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredCourses.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredCourses, currentPage]);
  
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);

  // 예비 신청 추가 (시간 중복 검사 포함)
  const handleAddCourse = (course) => {
    if (myCourses.some(mc => mc.classId === course.classId)) {
      alert('이미 예비 신청한 강의입니다.');
      return;
    }
    const conflict = myCourses.find(existing => isTimeConflict(existing, course));
    if (conflict) {
      alert(`시간이 겹치는 강의가 이미 신청되었습니다: ${conflict.className}`);
      return;
    }
    addPreRegistration({ studentId, classId: course.classId, preset })
      .then(() => {
        setMyCourses(prev => [...prev, course]);
        return fetchPreRegistrationCount(); // ✅ 신청 인원 다시 로딩
      })
      .then(setRegistrationCounts)
      .then(() => alert("강의가 예비 신청 목록에 추가되었습니다."))
      .catch(error => {
        console.error("Error adding course:", error);
        alert("강의 추가 실패");
      });
  };

  const handleRemoveCourse = (classId) => {
    removePreRegistration({ studentId, classId, preset })
  .then(() => {
    setMyCourses(prev => prev.filter(c => c.classId !== classId));
    return fetchPreRegistrationCount(); // ✅ 신청 인원 다시 로딩
  })
  .then(setRegistrationCounts)
  .then(() => alert("강의가 예비 신청 목록에서 제거되었습니다."))
  .catch(error => {
    console.error("Error removing course:", error);
    alert("강의 삭제 실패");
  });
  };

  const weekDays = ['월', '화', '수', '목', '금'];

  const preMajorCredits = myCourses
    .filter(course => course.courseType === '전공')
    .reduce((sum, course) => sum + course.credit, 0);
  const preGeneralCredits = myCourses
    .filter(course => course.courseType === '교양')
    .reduce((sum, course) => sum + course.credit, 0);

  const expectedMajorCreditNeeded = creditInfo
    ? Math.max(0, creditInfo.majorCreditNeeded - preMajorCredits)
    : null;
  const expectedGeneralCreditNeeded = creditInfo
    ? Math.max(0, creditInfo.generalCreditNeeded - preGeneralCredits)
    : null;

  // 타임테이블 시간 슬롯: 09:00 ~ 22:00 (1시간 단위)
  const startHour = 9;
  const endHour = 22;
  const timeSlots = [];
  for (let hour = startHour; hour <= endHour; hour++) {
    timeSlots.push(`${hour < 10 ? '0' : ''}${hour}:00`);
  }

  // 강의마다 순서대로 배정할 색상 팔레트
  const timetableColors = ['#F18578', '#A6C871', '#E9C16A', '#7EA4E7', '#9D84E1', '#FCA965', '#D195EB', '#7ED0C2'];
  const courseColors = {};
  myCourses.forEach((course, index) => {
    courseColors[course.classId] = timetableColors[index % timetableColors.length];
  });

  // 시간 문자열 "HH:mm"을 분 단위 숫자로 변환
  const convertTimeToMinutes = (timeStr) => {
    const [hour, minute] = timeStr.split(':').map(Number);
    return hour * 60 + minute;
  };
  const timetableStart = startHour * 60;
  const timetableEnd = endHour * 60;
  const totalMinutes = timetableEnd - timetableStart;
  const timetablePixelHeight = 600; // 기존 840에서 줄임


  return (
    <div className="pre-reg-container">
      {/* 좌측 사이드바: 학점 정보 */}
      <aside className="sidebar">
        <h2>학점 정보</h2>
        <div className="sidebar-info">
          <label>
            <strong>프리셋 선택:</strong>
            <select value={preset} onChange={e => setPreset(Number(e.target.value))}>
              <option value={1}>프리셋 1</option>
              <option value={2}>프리셋 2</option>
              <option value={3}>프리셋 3</option>
            </select>
          </label>
          {creditInfo ? (
            <>
              <hr />
              <p><strong>📘 예상 전공 남은 학점: {expectedMajorCreditNeeded}</strong></p>
              <p><strong>📗 예상 교양 남은 학점: {expectedGeneralCreditNeeded}</strong></p>
              <hr />
              <p>📘 예상 전공 취득 학점: {preMajorCredits}</p>
              <p>📗 예상 교양 취득 학점: {preGeneralCredits}</p>
              <hr />
              <span><strong>졸업 요건</strong></span>
              <p>전공 남은 학점: {creditInfo.majorCreditNeeded}</p>
              <p>교양 남은 학점: {creditInfo.generalCreditNeeded}</p>
              <hr />
              <p>이번 학기 최소 학점: {minCredit}</p>
              <p>이번 학기 최대 학점: {maxCredit}</p>
            </>
          ) : (
            <p>학점 정보를 불러오는 중입니다...</p>
          )}
        </div>
      </aside>

      {/* 오른쪽 메인 콘텐츠 */}
      <main className="main-content">
      <h3 className='title-bar'>예비 수강신청</h3>
      {/* 상단: 검색 + 시간표 보기 버튼 한 줄 정렬 */}
      <div className="search-row">
        <div className="search-bar">
          <input
            type="text"
            placeholder="강의명 / 교수명 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button>검색</button>
        </div>

        <div className="timetable-button">
          <button onClick={() => setIsTimetableOpen(true)}>📅 예비 시간표 보기</button>
        </div>
      </div>


        {/* 중단: 강의 리스트 */}
        <div className="course-list">
          <h3>강의 목록</h3>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>강의명</th>
                <th>학점</th>
                <th>구분</th>
                <th>교수</th>
                <th>요일</th>
                <th>시간</th>
                <th>정원/신청 인원</th>
                <th>신청</th>
              </tr>
            </thead>
            <tbody>
          {paginatedCourses.map((course, idx) => {
            const isAlreadyAdded = myCourses.some(mc => mc.classId === course.classId);
            const isConflict = myCourses.some(existing => isTimeConflict(existing, course));
            const isDisabled = isAlreadyAdded || isConflict;

            return (
              <tr key={course.classId}>
                <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                <td>{course.className}</td>
                <td>{course.credit}</td>
                <td>{course.courseType}</td>
                <td>{course.professor}</td>
                <td>{course.dayOfWeek.join(', ')}</td>
                <td>{course.startTime} ~ {course.endTime}</td>
                <td>{course.capacity} / {
                  registrationCounts.find(c => c.classId === course.classId)?.count ?? 0
                }</td>
                <td>
                  <button
                    onClick={() => handleAddCourse(course)}
                    disabled={isDisabled}
                    style={{
                      pointerEvents: isDisabled ? 'none' : 'auto',
                      backgroundColor: isDisabled ? 'gray' : '',
                      color: isDisabled ? 'black' : '',
                      opacity: isDisabled ? 0.7 : 1, // 살짝 흐리게
                      cursor: isDisabled ? 'not-allowed' : 'pointer'
                    }}
                  >
                    담기
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
          </table>
        </div>

        <div className="pagination">
          {currentPage > 1 && (
            <button onClick={() => setCurrentPage(currentPage - 1)}>
              ◀ 이전
            </button>
          )}

          <span style={{ margin: '0 1rem' }}>
            [ {currentPage} / {totalPages} ]
          </span>

          {currentPage < totalPages && (
            <button onClick={() => setCurrentPage(currentPage + 1)}>
              다음 ▶
            </button>
          )}
        </div>

        {/* 하단: 내가 신청한 강의 (예비 신청 목록) */}
        <div className="my-courses">
          <h3>내가 예비 신청한 강의</h3>
          {myCourses.length === 0 ? (
            <p>아직 신청한 강의가 없습니다.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>강의명</th>
                  <th>학점</th>
                  <th>구분</th>
                  <th>요일</th>
                  <th>시간</th>
                  <th>취소</th>
                </tr>
              </thead>
              <tbody>
                {myCourses.map((course, idx) => (
                  <tr key={course.classId}>
                    <td>{idx + 1}</td>
                    <td>{course.className}</td>
                    <td>{course.credit}</td>
                    <td>{course.courseType}</td>
                    <td>{course.dayOfWeek.join(', ')}</td>
                    <td>{course.startTime} ~ {course.endTime}</td>
                    <td>
                      <button onClick={() => handleRemoveCourse(course.classId)}>
                        취소
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

              {/* 요일별 강의 블록 */}
              {isTimetableOpen && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <div className="modal-header">
                    <h3 className='title-bar'>예비 시간표 <button className="delete-button" onClick={() => setIsTimetableOpen(false)}>✖</button></h3>
                  </div>
                  <div className="modal-body">
                    <div className="timetable">
                      {/* 헤더 (요일) */}
                      <div className="timetable-header">
                        <div className="time-label-header"></div>
                        {weekDays.map(day => (
                          <div key={day} className="day-header">{day}</div>
                        ))}
                      </div>

                      <div className="timetable-body">
                        {/* 좌측 시간 라벨 */}
                        <div className="time-labels">
                          {timeSlots.map(time => (
                            <div key={time} className="time-slot-label">{time}</div>
                          ))}
                        </div>

                        {/* timetable-columns*/}
                        <div className="timetable-columns">
                          {/* ✅ 회색 가로선 그리드 */}
                        <div className="background-grid">
                          {timeSlots.map((_, index) => (
                            <div key={index} className="grid-row-line" />
                          ))}
                        </div>

                          {/* 요일별 강의 칸 */}
                          {weekDays.map(day => (
                            <div key={day} className="timetable-column">
                              {myCourses.filter(course => course.dayOfWeek.includes(day)).map(course => {
                                const courseStart = convertTimeToMinutes(course.startTime);
                                const courseEnd = convertTimeToMinutes(course.endTime);
                                const top = ((courseStart - timetableStart) / totalMinutes) * timetablePixelHeight;
                                const height = ((courseEnd - courseStart) / totalMinutes) * timetablePixelHeight;
                                return (
                                  <div
                                    key={course.classId}
                                    className="course-block"
                                    style={{
                                      top: `${top}px`,
                                      height: `${height}px`,
                                      backgroundColor: courseColors[course.classId]
                                    }}
                                  >
                                     <div className='course-name'>{course.className}</div>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
      </main>
    </div>
  );
}

export default PreRegistrationPage;
