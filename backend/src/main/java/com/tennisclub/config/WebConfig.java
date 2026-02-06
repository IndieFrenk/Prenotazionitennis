package com.tennisclub.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Additional Web MVC configuration.
 *
 * Maps the URL path {@code /api/uploads/**} to the physical upload directory
 * on disk so that uploaded files (e.g. court photos) can be served as static
 * resources without a dedicated controller.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Normalise the path so it always ends with a separator
        String location = uploadDir.endsWith("/") ? uploadDir : uploadDir + "/";

        registry.addResourceHandler("/api/uploads/**")
                .addResourceLocations("file:" + location);
    }
}
