import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchPreRegistrationCourses,
  fetchMyPreRegisteredCourses,
  fetchFinalRegisteredCourses,
  addFinalRegistration,
  removeFinalRegistration,
  fetchFinalRegistrationCount
} from '../api/courseApi';

import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import '../styles/PreRegistrationPage.css';

function FinalRegistrationPage() {
  const { user } = useAuth();
  const studentId = user?.userId;
  const [availableCourses, setAvailableCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [preset, setPreset] = useState(1);
  const [preRegisteredCourses, setPreRegisteredCourses] = useState([]);
  const [finalRegisteredCourses, setFinalRegisteredCourses] = useState([]);
  const [finalCounts, setFinalCounts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;


  // 본 수강신청한 총 학점 계산
const totalCredits = useMemo(() => {
    return finalRegisteredCourses.reduce((sum, course) => sum + course.credit, 0);
  }, [finalRegisteredCourses]);
  
  
  useEffect(() => {
    if (studentId) {
      Promise.all([
        fetchPreRegistrationCourses(),
        fetchMyPreRegisteredCourses(studentId, preset),
        fetchFinalRegisteredCourses(studentId),
        fetchFinalRegistrationCount()
      ])
        .then(([courses, pre, finals, counts]) => {
          setAvailableCourses(courses);
          setPreRegisteredCourses(pre);
          setFinalRegisteredCourses(finals);
          setFinalCounts(counts);
        })
        .catch(err => console.error("데이터 불러오기 실패:", err));
    }
  }, [studentId, preset]);

  useEffect(() => {
    const socket = new SockJS('https://learn-alive-5d351ee528be.herokuapp.com/ws');
    const stompClient = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      onConnect: () => {
  
        // ✅ 실시간 본 수강신청 인원 수신
        stompClient.subscribe('/topic/finalCounts', (message) => {
          const counts = JSON.parse(message.body);
          console.log("📥 본 신청 실시간 인원:", counts);
          setFinalCounts(counts);
        });
      },
      onStompError: (frame) => {
        console.error("❌ STOMP 에러:", frame);
      }
    });
  
    stompClient.activate();
  
    return () => {
      if (stompClient.connected) {
        stompClient.deactivate();
      }
    };
  }, []);

  const handleFinalRegister = async (course) => {
    const currentCount = finalCounts.find(c => c.classId === course.classId)?.count ?? 0;
  
    // 이미 최종 신청된 강의일 경우
    if (finalRegisteredCourses.some(c => c.classId === course.classId)) {
      alert(`이미 '${course.className}' 강의를 수강신청하셨습니다.`);
      return;
    }
  
    // 정원 초과
    if (currentCount >= course.capacity) {
      alert(`'${course.className}' 강의의 정원이 초과되어 신청할 수 없습니다.`);
      return;
    }
  
    try {
      await addFinalRegistration({ studentId, classId: course.classId });
      setFinalRegisteredCourses(prev => [...prev, course]);
      setPreRegisteredCourses(prev => prev.filter(c => c.classId !== course.classId));
      const updatedCounts = await fetchFinalRegistrationCount();
      setFinalCounts(updatedCounts);
      alert(`'${course.className}' 강의가 본 수강신청되었습니다.`);
    } catch (error) {
      console.error('신청 실패:', error);
      if (error?.response?.data?.includes("중복")) {
        alert(`이미 '${course.className}' 강의를 신청하셨습니다.`);
      } else {
        alert('신청 중 오류가 발생했습니다. 다시 시도해 주세요.');
      }
    }
  };

  const handleCancelFinal = async (classId) => {
    const course = finalRegisteredCourses.find(c => c.classId === classId);
    const courseName = course?.className || "해당 강의";
  
    const confirm = window.confirm(`'${courseName}' 강의 수강신청을 정말 취소하시겠습니까?`);
    if (!confirm) return;
  
    try {
      await removeFinalRegistration({ studentId, classId });
      setFinalRegisteredCourses(prev => prev.filter(c => c.classId !== classId));
      const updatedCounts = await fetchFinalRegistrationCount();
      setFinalCounts(updatedCounts);
      alert(`'${courseName}' 강의의 본 수강신청이 취소되었습니다.`);
    } catch (error) {
      console.error('취소 실패:', error);
      alert('수강신청 취소 중 오류가 발생했습니다.');
    }
  };

  const filteredCourses = useMemo(() => {
    const lower = searchTerm.toLowerCase();
    return availableCourses.filter(course =>
      (course.className?.toLowerCase()?.includes(lower) ?? false) ||
      (course.professor?.toLowerCase()?.includes(lower) ?? false)
    );
  }, [searchTerm, availableCourses]);

  const paginatedCourses = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredCourses.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredCourses, currentPage]);
  
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  const pageNumbers = [...Array(totalPages).keys()].map(n => n + 1);

  return (
    <div className="pre-reg-container">
        <aside className="sidebar">
        <h2>학점 정보</h2>
        <div className="sidebar-info">
        <hr />
            <p><strong>📘 신청한 총 학점: {totalCredits}학점</strong></p>
            <hr />
              <p>이번 학기 최소 학점: 15</p>
              <p>이번 학기 최대 학점: 21</p></div>
        </aside>

{/* 오른쪽 메인 콘텐츠 */}
<main className="main-content">

      <h2 className='title-bar'>수강신청</h2>

      {/* 전체 강의 검색 및 목록 */}
      <div className="search-bar">
          <input
            type="text"
            placeholder="강의명 / 교수명 검색"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button>검색</button>
        </div>

      <div className="course-list">
        <h3>전체 강의 목록</h3>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>강의명</th>
              <th>교수</th>
              <th>학점</th>
              <th>요일</th>
              <th>시간</th>
              <th>정원/신청</th>
              <th>신청</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCourses.map((course, index) => {
              const count = finalCounts.find(c => c.classId === course.classId)?.count ?? 0;
              return (
                <tr key={course.classId}>
                  <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td>{course.className}</td>
                  <td>{course.professor}</td>
                  <td>{course.credit}</td>
                  <td>{course.dayOfWeek.join(', ')}</td>
                  <td>{course.startTime} ~ {course.endTime}</td>
                  <td>{course.capacity} / {count}</td>
                  <td>
                   <button onClick={() => handleFinalRegister(course)}>
                    신청
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      
      <div className="pagination">
        <button
          onClick={() => setCurrentPage((prev) => prev - 1)}
          disabled={currentPage === 1}
          className={currentPage === 1 ? "disabled-button" : ""}
        >
          ◀ 이전
        </button>
      
        <span style={{ margin: '0 1rem' }}>
          [ {currentPage} / {totalPages} ]
        </span>
      
        <button
          onClick={() => setCurrentPage((prev) => prev + 1)}
          disabled={currentPage === totalPages}
          className={currentPage === totalPages ? "disabled-button" : ""}
        >
          다음 ▶
        </button>
      </div>



      {/* 장바구니 (프리셋별) */}
      <div className="pre-registered">
        <h3>장바구니 강의 (프리셋)
          <select value={preset} onChange={e => setPreset(Number(e.target.value))}>
            <option value={1}>프리셋 1</option>
            <option value={2}>프리셋 2</option>
            <option value={3}>프리셋 3</option>
          </select>
        </h3>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>강의명</th>
              <th>교수</th>
              <th>학점</th>
              <th>요일</th>
              <th>시간</th>
              <th>신청</th>
            </tr>
          </thead>
          <tbody>
            {preRegisteredCourses.map((course, index) => (
              <tr key={course.classId}>
                <td>{index + 1}</td>
                <td>{course.className}</td>
                <td>{course.professor}</td>
                <td>{course.credit}</td>
                <td>{course.dayOfWeek.join(', ')}</td>
                <td>{course.startTime} ~ {course.endTime}</td>
                <td>
                  <button onClick={() => handleFinalRegister(course)}>신청</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 최종 신청 목록 */}
      <div className="final-registered">
        <h3>✅ 최종 신청 완료한 강의</h3>
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>강의명</th>
              <th>교수</th>
              <th>학점</th>
              <th>요일</th>
              <th>시간</th>
              <th>취소</th>
            </tr>
          </thead>
          <tbody>
            {finalRegisteredCourses.map((course, index) => (
              <tr key={course.classId}>
                <td>{index + 1}</td>
                <td>{course.className}</td>
                <td>{course.professor}</td>
                <td>{course.credit}</td>
                <td>{course.dayOfWeek.join(', ')}</td>
                <td>{course.startTime} ~ {course.endTime}</td>
                <td>
                  <button onClick={() => handleCancelFinal(course.classId)}>취소</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </main>
    </div>
  );
}

export default FinalRegistrationPage;
