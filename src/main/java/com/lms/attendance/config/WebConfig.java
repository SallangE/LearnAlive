// src/main/java/com/lms/attendance/config/WebConfig.java
package com.lms.attendance.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

import java.io.IOException;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        // 1) 정적 assets 확실히 매핑
        registry.addResourceHandler("/assets/**")
                .addResourceLocations("classpath:/static/assets/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver());

        // 2) SPA fallback
        //    실제 파일이 있으면 그대로 서빙, 없고 점(.) 없는 비-API 경로면 index.html
        registry.addResourceHandler("/**")   // ← 여기! "/**/*" 금지, "/**" 사용
                .addResourceLocations("classpath:/static/")
                .resourceChain(true)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        Resource requested = location.createRelative(resourcePath);
                        if (requested.exists() && requested.isReadable()) {
                            return requested; // 실제 파일이면 그대로
                        }
                        String path = "/" + resourcePath;
                        boolean looksLikeFile = resourcePath.contains(".");
                        boolean isApi = path.startsWith("/api/");
                        if (!looksLikeFile && !isApi) {
                            return location.createRelative("index.html"); // SPA 진입
                        }
                        return null; // 그 외는 404
                    }
                });
    }
}
