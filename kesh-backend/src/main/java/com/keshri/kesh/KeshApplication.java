package com.keshri.kesh;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class KeshApplication {
    public static void main(String[] args) {
        SpringApplication.run(KeshApplication.class, args);
        System.out.println("\n==================================");
        System.out.println(" KESH backend is online.");
        System.out.println(" Try: POST http://localhost:8080/api/chat");
        System.out.println("==================================\n");
    }
}
