package com.lms.attendance.service;

import com.lms.attendance.model.ChatBot;
import com.lms.attendance.repository.ChatBotMapper;
import lombok.RequiredArgsConstructor;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ChatBotService {
    
    private final ChatBotMapper chatBotMapper;

    // 전체 챗봇 질문/답변 조회
    public List<ChatBot> getAllChatBots() {
        return chatBotMapper.selectAllChatBot();
    }

    // 특정 키워드로 챗봇 질문/답변 검색
    public List<ChatBot> searchChatBotByKeyword(String keyword) {
        return chatBotMapper.selectChatBotByKeyword(keyword);
    }
}