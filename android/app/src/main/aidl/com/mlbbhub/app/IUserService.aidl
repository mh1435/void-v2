package com.mlbbhub.app;

// Runs in a separate process Shizuku starts under shell-level (adb)
// privileges once the user has granted permission. This is the only
// supported way to execute privileged commands with current Shizuku
// versions — Shizuku.newProcess() is private in the version this app uses.
interface IUserService {
    String exec(String cmd);
    void destroy();
}
