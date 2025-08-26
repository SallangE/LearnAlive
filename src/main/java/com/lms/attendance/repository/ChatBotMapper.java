package com.lms.attendance.repository;

import java.util.List;
import org.apache.ibatis.annotations.*;
import com.lms.attendance.model.ChatBot;

@Mapper
public interface ChatBotMapper {

    // 전체 챗봇 질문/답변 조회
    @Results({
        @Result(property = "question", column = "question"),
        @Result(property = "answer", column = "answer")
    })
    @Select("SELECT question, answer FROM chatbot")
    List<ChatBot> selectAllChatBot();

    // 특정 키워드로 챗봇 질문/답변 검색
    @Results({
        @Result(property = "question", column = "question"),
        @Result(property = "answer", column = "answer")
    })
    @Select("SELECT question, answer FROM chatbot WHERE question LIKE CONCAT('%', #{keyword}, '%')")
    List<ChatBot> selectChatBotByKeyword(@Param("keyword") String keyword);
}