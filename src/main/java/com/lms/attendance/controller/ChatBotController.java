package com.lms.attendance.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lms.attendance.model.ChatBot;
import com.lms.attendance.service.ChatBotService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
public class ChatBotController {

    private final ChatBotService chatBotService;

    // 모든 챗봇 질문/답변 가져오기
    @GetMapping("/all")
    public ResponseEntity<List<ChatBot>> getAllChatBots() {
        List<ChatBot> chatBots = chatBotService.getAllChatBots();
        System.out.println("🔍 가져온 챗봇 데이터: " + chatBots);
        return ResponseEntity.ok(chatBots);
    }

    // 특정 키워드로 질문/답변 검색
    @GetMapping("/search")
    public ResponseEntity<List<ChatBot>> searchChatBot(@RequestParam String keyword) {
        System.out.println("🔍 검색 요청 키워드: " + keyword);
        List<ChatBot> searchResults = chatBotService.searchChatBotByKeyword(keyword);
        System.out.println("🔍 검색 결과: " + searchResults);
        return ResponseEntity.ok(searchResults);
    }
}