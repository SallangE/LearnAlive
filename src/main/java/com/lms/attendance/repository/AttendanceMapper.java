package com.lms.attendance.repository;

import org.apache.ibatis.annotations.*;

import com.lms.attendance.model.Attendance;

import java.util.List;

@Mapper
public interface AttendanceMapper {

	// ✅ 현재 출석 가능 여부 확인 (DB에서 직접 체크)
	@Select("""
			    SELECT CASE
			        WHEN NOW() < present_start THEN 'early'
			        WHEN NOW() > end_time THEN 'late'
			        ELSE 'valid'
			    END AS check_result
			    FROM class
			    WHERE class_id = #{classId}
			""")
	String checkAttendanceAvailability(@Param("classId") int classId);

	// 중복 체크 로직
	@Select("""
			    SELECT COUNT(*) FROM attendance
			    WHERE student_id = #{studentId}
			      AND class_id = #{classId}
			      AND date = #{date}
			""")
	int checkExistingAttendance(@Param("studentId") String studentId, @Param("classId") int classId,
			@Param("date") String date);

	// ✅ 학생 출석 시도 (Attendance 객체를 받아 처리)
	@Insert("INSERT INTO Attendance (student_id, class_id, date, state, created_at, updated_at) " +
	        "VALUES (#{studentId}, #{classId}, #{date}, " +
	        "CASE WHEN TIME(NOW()) BETWEEN (SELECT present_start FROM class WHERE class_id = #{classId}) " +
	        "AND (SELECT present_end FROM class WHERE class_id = #{classId}) THEN 'present' " +
	        "WHEN TIME(NOW()) BETWEEN (SELECT present_end FROM class WHERE class_id = #{classId}) " +
	        "AND (SELECT late_end FROM class WHERE class_id = #{classId}) THEN 'late' " +
	        "ELSE 'absent' END, NOW(), NULL)")
	@Options(useGeneratedKeys = true, keyProperty = "attendanceId")
	void studentCheckIn(Attendance attendance);

	// 출석 관리 페이지에서 해당 강의 학생 출결 데이터 전체 조회
	@Select("""
			    SELECT
			        COALESCE(a.attendance_id, 0) AS attendance_id,
			        s.student_id AS student_id,
			        s.name AS name,
			        s.university AS university,
			        s.department AS department,
			        sc.class_id AS class_id,
			        c.class_name AS class_name,
			        COALESCE(a.date, #{date}) AS date,
			        COALESCE(a.state, 'absent') AS state,
			        COALESCE(a.reason, '미등록') AS reason,
			        COALESCE(sc.remarks, '') AS remarks,
			        COALESCE(a.created_at, NULL) AS created_at,
			        COALESCE(a.updated_at, NULL) AS updated_at
			    FROM student_class sc
			    JOIN Student s ON s.student_id = sc.student_id
			    LEFT JOIN Attendance a
			        ON s.student_id = a.student_id
			        AND a.class_id = #{classId}
			        AND a.date = #{date}
			    LEFT JOIN Class c
			        ON sc.class_id = c.class_id
			    WHERE sc.class_id = #{classId}
			""")
	@Results(id = "AttendanceResultMap", value = { @Result(column = "attendance_id", property = "attendanceId"),
			@Result(column = "student_id", property = "studentId"), @Result(column = "name", property = "name"),
			@Result(column = "university", property = "university"),
			@Result(column = "department", property = "department"), @Result(column = "class_id", property = "classId"),
			@Result(column = "class_name", property = "className"), @Result(column = "date", property = "date"),
			@Result(column = "state", property = "state"), @Result(column = "reason", property = "reason"),
			@Result(column = "remarks", property = "remarks"), @Result(column = "created_at", property = "createdAt"),
			@Result(column = "updated_at", property = "updatedAt") })
	List<Attendance> findAttendanceByClassAndDate(@Param("classId") int classId, @Param("date") String date);

	@Insert("""
			    INSERT INTO Attendance (student_id, class_id, date, state, created_at, updated_at)
			    SELECT #{studentId}, #{classId}, #{date}, #{state}, NOW(), NOW()
			    FROM DUAL
			    WHERE NOT EXISTS (
			        SELECT 1 FROM attendance
			        WHERE student_id = #{studentId}
			          AND class_id = #{classId}
			          AND date = #{date}
			    )
			""")
	void insertAttendance(@Param("studentId") String studentId, @Param("classId") int classId,
			@Param("date") String date, @Param("state") String state);

	@Update("""
			    UPDATE Attendance
			    SET state = #{state}, updated_at = NOW()
			    WHERE attendance_id = #{attendanceId}
			""")
	void updateAttendanceState(@Param("attendanceId") int attendanceId, @Param("state") String state);

	@Update("""
			    UPDATE Attendance
			    SET reason = #{reason}, updated_at = NOW()
			    WHERE attendance_id = #{attendanceId}
			""")
	void updateAttendanceReason(@Param("attendanceId") int attendanceId, @Param("reason") String reason);

	@Delete("""
			    DELETE FROM attendance WHERE attendance_id = #{attendanceId}
			""")
	void deleteAttendance(@Param("attendanceId") int attendanceId);

	@Select("""
			    SELECT COUNT(*) FROM attendance
			    WHERE student_id = #{studentId} AND class_id = #{classId} AND date = #{date}
			""")
	int checkDuplicateAttendance(@Param("studentId") String studentId, @Param("classId") int classId,
			@Param("date") String date);

	// ✅ 출석 기록 조회
	@Select("""
			    SELECT attendance_id, student_id, class_id, date, state, created_at, updated_at
			    FROM attendance
			    WHERE student_id = #{studentId}
			      AND class_id = #{classId}
			      AND date = #{date}
			""")
	Attendance getAttendanceByStudentAndDate(@Param("studentId") String studentId, @Param("classId") int classId,
			@Param("date") String date);

	// 본인의 출결 내역 확인
	@Select("""
		    SELECT
		        a.student_id AS studentId,
		        (SELECT name FROM student WHERE student_id = a.student_id) AS name,
		        (SELECT university FROM student WHERE student_id = a.student_id) AS university,
		        (SELECT department FROM student WHERE student_id = a.student_id) AS department,
		        a.class_id AS classId,
		        (SELECT class_name FROM class WHERE class_id = a.class_id) AS className,
		        a.state AS state,
		        a.reason AS reason,
		        a.date AS date
		    FROM attendance a
		    WHERE a.student_id = #{studentId}
		      AND a.date = #{date}
		""")
		@Results(id = "StudentAttendanceResultMap", value = {
		    @Result(column = "studentId", property = "studentId"),
		    @Result(column = "name", property = "name"),
		    @Result(column = "university", property = "university"),
		    @Result(column = "department", property = "department"),
		    @Result(column = "classId", property = "classId"),
		    @Result(column = "className", property = "className"),
		    @Result(column = "state", property = "state"),
		    @Result(column = "reason", property = "reason"),
		    @Result(column = "date", property = "date")
		})
		List<Attendance> findAttendanceByStudent(@Param("studentId") String studentId, @Param("date") String date);


	// 학생의 해당 월(YYYY-MM)에 대한 출석 기록 조회
			@Select("SELECT attendance_id, student_id, class_id, date, state, reason, created_at, updated_at "
					+ "FROM attendance " + "WHERE student_id = #{studentId} " + "AND date LIKE CONCAT(#{month}, '%')")
			List<Attendance> findAttendanceByStudentForMonth(@Param("studentId") String studentId, @Param("month") String month);
		
			
			@Select("SELECT attendance_id, student_id, class_id, date, state, reason, created_at, updated_at " +
			        "FROM attendance " +
			        "WHERE student_id = #{studentId} AND date < #{endDate} " +
			        "ORDER BY date DESC")
			@ResultMap("AttendanceResultMap")
			List<Attendance> findPastAttendanceByStudent(@Param("studentId") String studentId, @Param("endDate") String endDate);


			//결석 수 조회
			@Select("SELECT COUNT(*) FROM attendance WHERE student_id = #{studentId} AND state = 'absent'")
			int countAbsentsByStudentId(@Param("studentId") String studentId);
			//지각 수 조회
			@Select("SELECT COUNT(*) FROM attendance WHERE student_id = #{studentId} AND state = 'late'")
			int countLatesByStudentId(@Param("studentId") String studentId);
			
			//출석 Id로 해당 학생의 출석 정보를 가져옴
			@Select("SELECT * FROM attendance WHERE attendance_id = #{attendanceId}")
			Attendance getAttendanceById(@Param("attendanceId") int attendanceId);

			
			@Select("""
				    SELECT
				        a.attendance_id,
				        a.student_id,
				        s.name,
				        a.class_id,
				        a.date,
				        a.state,
				        a.reason,
				        a.created_at,
				        a.updated_at
				    FROM attendance a
				    JOIN Student s ON a.student_id = s.student_id
				    WHERE a.class_id = #{classId}
				      AND a.date LIKE CONCAT(#{month}, '%')
				""")
				@ResultMap("AttendanceResultMap")
				List<Attendance> findAttendanceByClassForMonth(@Param("classId") int classId, @Param("month") String month);

}