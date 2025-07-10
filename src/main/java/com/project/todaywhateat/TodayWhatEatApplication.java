package com.project.todaywhateat;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;

@SpringBootApplication
@ComponentScan(basePackages = {"com.project.todaywhateat", "com.project.todaywhateat.config"})
public class TodayWhatEatApplication {

    public static void main(String[] args) {
        SpringApplication.run(TodayWhatEatApplication.class, args);
    }

}
