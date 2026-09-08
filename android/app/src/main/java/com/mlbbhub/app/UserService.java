package com.mlbbhub.app;

import java.io.BufferedReader;
import java.io.InputStreamReader;

/**
 * The privileged side of the Shizuku bridge: Shizuku starts this class in a
 * separate process running as shell/root (whichever backs the user's
 * Shizuku setup), and ShizukuPlugin binds to it via
 * Shizuku.bindUserService(). Runtime.exec() here genuinely runs with
 * shell-level privileges, unlike a normal Runtime.exec() call from VOID's
 * own app process.
 */
public class UserService extends IUserService.Stub {

    // Required no-arg constructor — Shizuku instantiates this via reflection.
    public UserService() {}

    @Override
    public String exec(String cmd) {
        try {
            Process p = Runtime.getRuntime().exec(new String[]{"sh", "-c", cmd});
            StringBuilder out = new StringBuilder();
            try (BufferedReader r = new BufferedReader(new InputStreamReader(p.getInputStream()))) {
                String line;
                while ((line = r.readLine()) != null) out.append(line).append('\n');
            }
            try (BufferedReader err = new BufferedReader(new InputStreamReader(p.getErrorStream()))) {
                String line;
                while ((line = err.readLine()) != null) out.append(line).append('\n');
            }
            p.waitFor();
            return out.toString();
        } catch (Exception e) {
            return "ERROR: " + e.getMessage();
        }
    }

    // Shizuku's contract: without this, the user-service process leaks after unbind.
    @Override
    public void destroy() {
        System.exit(0);
    }
}
