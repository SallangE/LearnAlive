package com.lms.attendance.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // 정적 파일은 index.html로 리다이렉트하지 않도록 예외 처리
        registry.addViewController("/{spring:(?!static|assets).*}")
                .setViewName("forward:/index.html");
        registry.addViewController("/**/{spring:(?!static|assets).*}")
                .setViewName("forward:/index.html");
        registry.addViewController("/{spring:(?!static|assets).*}/**{spring:?!(\\.js|\\.css)$}")
                .setViewName("forward:/index.html");
    }
}
