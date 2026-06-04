#include <windows.h>
#include <iostream>
#include <string>
#include <cstdlib>

// ffmpegがPATHに通っているか確認
bool checkFFmpeg() {
    STARTUPINFOA si = { sizeof(si) };
    PROCESS_INFORMATION pi;
    si.dwFlags = STARTF_USESTDHANDLES;
    si.hStdOutput = INVALID_HANDLE_VALUE;
    si.hStdError  = INVALID_HANDLE_VALUE;

    std::string cmd = "cmd.exe /c ffmpeg -version";
    char cmdBuf[256];
    strncpy_s(cmdBuf, cmd.c_str(), sizeof(cmdBuf));

    BOOL result = CreateProcessA(
        NULL, cmdBuf, NULL, NULL, FALSE,
        CREATE_NO_WINDOW, NULL, NULL, &si, &pi
    );
    if (!result) return false;

    WaitForSingleObject(pi.hProcess, 5000);
    DWORD exitCode = 1;
    GetExitCodeProcess(pi.hProcess, &exitCode);
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);
    return exitCode == 0;
}

void launchProcess(const std::string& title, const std::string& command) {
    STARTUPINFOA si = { sizeof(si) };
    PROCESS_INFORMATION pi;

    // 新しいコンソールウィンドウでコマンドを起動
    std::string cmd = "cmd.exe /k \"" + command + "\"";
    char* cmdChar = const_cast<char*>(cmd.c_str());

    si.lpTitle = const_cast<char*>(title.c_str());

    BOOL result = CreateProcessA(
        NULL,
        cmdChar,
        NULL, NULL,
        FALSE,
        CREATE_NEW_CONSOLE,
        NULL, NULL,
        &si, &pi
    );

    if (result) {
        std::cout << "[OK] " << title << " を起動しました\n";
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
    } else {
        std::cerr << "[ERROR] " << title << " の起動に失敗しました (code: " << GetLastError() << ")\n";
    }
}

int main() {
    SetConsoleOutputCP(65001); // UTF-8

    // このexeの場所を取得してプロジェクトルートとして使う
    char exePath[MAX_PATH];
    GetModuleFileNameA(NULL, exePath, MAX_PATH);
    std::string rootDir = exePath;
    rootDir = rootDir.substr(0, rootDir.find_last_of("\\/"));

    std::string backendDir  = rootDir + "\\backend";
    std::string frontendDir = rootDir + "\\frontend";

    std::cout << "========================================\n";
    std::cout << "   TabiTube 起動スクリプト\n";
    std::cout << "========================================\n\n";
    // FFmpeg チェック
    std::cout << "FFmpeg チェック中...\n";
    if (checkFFmpeg()) {
        std::cout << "[OK] FFmpeg 検出済み → HLSトランスコード有効\n\n";
    } else {
        std::cout << "[WARNING] FFmpeg が見つかりません\n";
        std::cout << "          チャンクストリーミングモードで動作します\n";
        std::cout << "          HLSを使うには C:\\ffmpeg\\bin を PATH に追加してください\n\n";
    }

    std::cout << "XAMPPのApacheとMySQLが起動していることを\n";
    std::cout << "確認してから何かキーを押してください...\n";
    std::cin.get();

    // Laravel サーバー
    launchProcess(
        "TabiTube - Laravel Server",
        "cd /d \"" + backendDir + "\" && php artisan serve"
    );
    Sleep(2000);

    // キューワーカー
    launchProcess(
        "TabiTube - Queue Worker",
        "cd /d \"" + backendDir + "\" && php artisan queue:work"
    );
    Sleep(2000);

    // React フロントエンド
    launchProcess(
        "TabiTube - React Frontend",
        "cd /d \"" + frontendDir + "\" && npm run dev"
    );

    std::cout << "\n========================================\n";
    std::cout << "   起動完了！\n";
    std::cout << "   フロント: http://localhost:5173\n";
    std::cout << "   API:      http://localhost:8000\n";
    std::cout << "========================================\n";
    std::cout << "\nこのウィンドウは閉じても構いません。\n";
    std::cin.get();

    return 0;
}
