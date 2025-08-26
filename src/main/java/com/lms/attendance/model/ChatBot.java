package com.lms.attendance.model;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatBot {
	
    private int id;              // 챗봇 질문/답변 ID
    private String question;     // 질문
    private String answer;       // 답변
    private LocalDateTime createdAt; // 생성 날짜 및 시간
}