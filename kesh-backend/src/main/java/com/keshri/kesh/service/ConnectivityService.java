package com.keshri.kesh.service;

import org.springframework.stereotype.Service;

import java.net.InetSocketAddress;
import java.net.Socket;

@Service
public class ConnectivityService {

    /** Quick check: can we reach the internet right now? */
    public boolean isOnline() {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress("8.8.8.8", 53), 800);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
