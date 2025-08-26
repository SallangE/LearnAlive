package com.lms.attendance.repository;


import java.util.List;

import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import com.lms.attendance.model.Course;
import com.lms.attendance.model.CourseRegistrationCount;
import com.lms.attendance.model.CreditInfo;

@Mapper
public interface CourseMapper {

    // ✅ 예비 수강신청 가능한 강의 조회
	@Select("""
		    SELECT c.class_id AS classId,
		           c.class_name AS className,
		           c.credit,
		           c.course_type AS courseType,
		           p.name AS professor,
		           GROUP_CONCAT(cd.day_of_week SEPARATOR ',') AS dayOfWeek,
		           c.start_time AS startTime,
		           c.end_time AS endTime,
		           c.capacity,
		           (c.capacity - IFNULL(crCount.count, 0)) AS remainingSeats
		    FROM class c
		    LEFT JOIN professor p ON c.prof_id = p.prof_id
		    LEFT JOIN class_day cd ON c.class_id = cd.class_id
		    LEFT JOIN (
		        SELECT class_id, COUNT(*) AS count
		        FROM course_registration
		        WHERE registration_status = '임시확정'
		        GROUP BY class_id
		    ) crCount ON c.class_id = crCount.class_id
		    GROUP BY c.class_id
		""")
		List<Course> findAvailableCourses();


    // ✅ 해당 학생이 예비로 신청한 강의 조회 (명시적 @Param 추가!)
	@Select("""
		    SELECT c.class_id AS classId, c.class_name AS className,
		           c.credit, c.course_type AS courseType,
		           p.name AS professor,
		           GROUP_CONCAT(cd.day_of_week SEPARATOR ',') AS dayOfWeek,
		           c.start_time AS startTime, c.end_time AS endTime,
		           c.capacity
		    FROM course_registration cr
		    JOIN class c ON cr.class_id = c.class_id
		    JOIN professor p ON c.prof_id = p.prof_id
		    JOIN class_day cd ON c.class_id = cd.class_id
		    WHERE cr.student_id = #{studentId}
		      AND cr.registration_status = '예비'
		      AND cr.preset = #{preset}        
		    GROUP BY c.class_id
		""")
		List<Course> findMyPreRegisteredCourses(@Param("studentId") String studentId, @Param("preset") int preset);


    // ✅ 예비 수강신청 추가
	@Insert("INSERT INTO course_registration (student_id, class_id, registration_status, preset) " +
	        "VALUES (#{studentId}, #{classId}, '예비', #{preset})")
	void insertPreRegistration(@Param("studentId") String studentId,
	                           @Param("classId") int classId,
	                           @Param("preset") int preset);

    // ✅ 예비 수강신청 삭제
    @Delete("DELETE FROM course_registration " +
            "WHERE student_id = #{studentId} AND class_id = #{classId} AND registration_status = '예비'")
    void deletePreRegistration(@Param("studentId") String studentId, @Param("classId") int classId);
    
    //학점 정보 가져오는 매퍼
    @Select("""
            SELECT sc.student_id AS studentId,
                   SUM(CASE WHEN c.course_type = '전공' THEN c.credit ELSE 0 END) AS majorCreditTaken,
                   SUM(CASE WHEN c.course_type = '교양' THEN c.credit ELSE 0 END) AS generalCreditTaken
            FROM student_class sc
            JOIN class c ON sc.class_id = c.class_id
            WHERE sc.student_id = #{studentId}
            GROUP BY sc.student_id
        """)
        CreditInfo sumCreditsByStudentId(@Param("studentId") String studentId);
    
    @Select("""
    	    SELECT class_id AS classId, COUNT(*) AS count
			FROM (
			  SELECT DISTINCT student_id, class_id
			  FROM course_registration
			  WHERE registration_status = '예비'
			) AS unique_student_class
			GROUP BY class_id
    	""")
    	List<CourseRegistrationCount> getPreRegistrationCounts();

 // 본 수강신청 추가
    @Update("""
    	    UPDATE course_registration
    	    SET registration_status = '확정', registered_at = NOW()
    	    WHERE student_id = #{studentId}
    	      AND class_id = #{classId}
    	""")
    	void updateRegistrationToFinal(@Param("studentId") String studentId, @Param("classId") int classId);

    // 본 수강신청 삭제
    @Delete("""
        DELETE FROM course_registration
        WHERE student_id = #{studentId}
          AND class_id = #{classId}
          AND registration_status = '확정'
    """)
    void deleteFinalRegistration(@Param("studentId") String studentId, @Param("classId") int classId);

    // 본 수강신청 내역 조회
    @Select("""
        SELECT c.class_id AS classId, c.class_name AS className,
               c.credit, c.course_type AS courseType,
               p.name AS professor,
               GROUP_CONCAT(cd.day_of_week SEPARATOR ',') AS dayOfWeek,
               c.start_time AS startTime, c.end_time AS endTime,
               c.capacity
        FROM course_registration cr
        JOIN class c ON cr.class_id = c.class_id
        JOIN professor p ON c.prof_id = p.prof_id
        JOIN class_day cd ON c.class_id = cd.class_id
        WHERE cr.student_id = #{studentId}
          AND cr.registration_status = '확정'
        GROUP BY c.class_id
    """)
    List<Course> findMyFinalRegisteredCourses(@Param("studentId") String studentId);

    // 본 수강신청 인원 수 조회
    @Select("""
        SELECT class_id AS classId, COUNT(DISTINCT student_id) AS count
        FROM course_registration
        WHERE registration_status = '확정'
        GROUP BY class_id
    """)
    List<CourseRegistrationCount> getFinalRegistrationCounts();

 // 확정 신청 중복 여부 확인
    @Select("""
        SELECT COUNT(*) FROM course_registration
        WHERE student_id = #{studentId}
          AND class_id = #{classId}
          AND registration_status = '확정'
    """)
    int isAlreadyFinalRegistered(@Param("studentId") String studentId, @Param("classId") int classId);

    //전체 강의 목록에서 본 수강신청 매퍼
    @Insert("""
    	    INSERT INTO course_registration (student_id, class_id, registration_status, registered_at)
    	    VALUES (#{studentId}, #{classId}, '확정', NOW())
    	""")
    	void insertFinalRegistrationDirect(@Param("studentId") String studentId, @Param("classId") int classId);

    //본수강신청에서 시도할 때 예비수강신청 되어있으면 update로 작동하도록 감지
    @Select("""
    	    SELECT COUNT(*) FROM course_registration
    	    WHERE student_id = #{studentId} AND class_id = #{classId} AND registration_status = '예비'
    	""")
    	int isPreRegistered(@Param("studentId") String studentId, @Param("classId") int classId);

 // ✅ F학점 알림용: 학생 ID를 기반으로 담당 교수 ID 조회
    @Select("""
    	    SELECT c.prof_id
    	    FROM student_class sc
    	    JOIN class c ON sc.class_id = c.class_id
    	    WHERE sc.student_id = #{studentId}
    	    LIMIT 1
    	""")
    	String findProfessorIdByStudentId(@Param("studentId") String studentId);
    
    @Select("SELECT prof_id FROM class WHERE class_id = (SELECT class_id FROM student_class WHERE student_id = #{studentId} LIMIT 1)")
    String findProfIdByStudentId(String studentId);
}