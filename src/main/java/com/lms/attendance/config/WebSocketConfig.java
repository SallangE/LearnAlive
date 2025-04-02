package com.lms.attendance.config;

import org.springframework.messaging.Message;
import org.springframework.security.core.Authentication;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

// WebSocket 관련 설정 클래스임을 나타내는 어노테이션
@Configuration

// STOMP 기반의 WebSocket 메시징을 활성화시키는 어노테이션
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    /**
     * 클라이언트가 WebSocket에 최초로 연결할 때 사용할 Endpoint를 등록합니다.
     * 예: React에서 `new SockJS("/ws")`로 연결 요청
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // "/ws"라는 경로로 WebSocket 핸드셰이크를 시작함
        // withSockJS()를 붙이면 WebSocket을 지원하지 않는 브라우저에서도 대체 방식으로 통신 가능
    	  registry.addEndpoint("/ws")
          .setAllowedOriginPatterns("*")
          .withSockJS(); // 클라이언트는 SockJS 가능
    }

    /**
     * 메시지 브로커 설정
     * 메시지를 어떤 경로로 보낼지, 어디서 받을지 규칙을 정의합니다.
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // 서버에서 클라이언트로 보내는 메시지의 prefix 설정
        // "/topic"으로 시작하는 목적지는 SimpleBroker가 처리 (예: 채팅방 구독 메시지)
    	//채팅방처럼 여러 구독자한테 메시지를 뿌려주는 역할을 가능하게 만든다
        config.enableSimpleBroker("/topic");//"브로커 기능을 켜서 /topic으로 시작하는 경로에 메시지를 전달해줘

        // 클라이언트에서 서버로 보낼 때 prefix 설정
        // "/app"으로 시작하는 메시지는 컨트롤러(@MessageMapping)로 라우팅됨
        config.setApplicationDestinationPrefixes("/app"); 
        
        config.setUserDestinationPrefix("/user");
    }  
    
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String login = accessor.getLogin(); // 🔥 프론트에서 보낸 login 헤더
                    if (login != null) {
                        accessor.setUser(() -> login); // ✅ Principal 등록
                        System.out.println("✅ [WebSocket 연결] 사용자 설정됨 → " + login);
                    } else {
                        System.out.println("❌ [WebSocket 연결] login 헤더 없음");
                    }
                }
                return message;
            }
        });
    }
}