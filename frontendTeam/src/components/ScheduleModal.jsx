import { useState } from "react";
import "../styles/calendar.css"

const ScheduleModal = ({ isModalOpen, selectedDate, formData, onChange, onSubmit, onClose  }) => {
  
  return (
    <div>

       {/* 일정 등록 모달 */}
       {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>일정 등록</h3>
            <p>날짜: {selectedDate}</p>
            <form onSubmit={onSubmit}>
              <input
                type="text"
                name="title"
                placeholder="제목"
                value={formData.title}
                onChange={onChange}
                required
              />
              <textarea
                name="content"
                placeholder="내용"
                value={formData.content}
                onChange={onChange}
              />
              <label>
              <br/>
               <span> 🔔알람 설정</span>
                <input
                  type="checkbox"
                  name="mark"
                  checked={formData.mark}
                  onChange={onChange}
                />  <br></br>
                 
              </label>
              <label>
                색상 선택: 
                <input
                  type="color"
                  name="color"
                  value={formData.color}  // formData에서 czgolor 값을 가져와서 설정
                  onChange={onChange}  // 색상 변경 시 formData.color 값 업데이트
                />
              </label>
               {/* 알람 시간 입력 필드 */}
               {formData.mark && (
                <label>
                  알람 시간:
                  <input
                    type="datetime-local"
                    name="alarmTime"
                    // value={formData.alarmTime || new Date().toISOString().slice(0, 16)}
                    value={formData.alarmTime ?? " "} // 비어있으면 빈 문자열로!
                    onChange={onChange}
                  />
                </label>
              )}

              <button type="submit">등록</button>
              <button onClick={() => onClose(false)}>취소</button>
            </form>
          </div>
        </div>
         )}
  </div>
  )
};

export default ScheduleModal;