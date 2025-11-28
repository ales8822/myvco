#Requires AutoHotkey v2.0

; -------------------------------------------------------------------
; CONFIG
; -------------------------------------------------------------------
; UPDATE THESE PATHS TO MATCH YOUR EXACT FOLDERS
backendDir := "C:\Users\AlAr\my_progs\myvco\backend"
frontendDir := "C:\Users\AlAr\my_progs\myvco\frontend"
frontendURL := "http://localhost:5173"

; -------------------------------------------------------------------
; GUI
; -------------------------------------------------------------------
MainGui := Gui("+Resize", "MyVCO Launcher")
MainGui.SetFont("s10", "Segoe UI")

MainGui.AddText("xm w250 center", "--- DEVELOPMENT MODE ---")

; This button launches the fancy Windows Terminal split-view
MainGui.AddButton("xm w250 h40", "🚀 Launch Dev Environment").OnEvent("Click", StartDevMode)

MainGui.AddText("xm w250 center", "--- TOOLS ---")
MainGui.AddButton("xm w250", "Open Frontend in Browser").OnEvent("Click", (*) => Run(frontendURL))
MainGui.AddButton("xm w250", "Kill All Node/Python").OnEvent("Click", KillAll)
MainGui.AddButton("xm w250", "Exit Launcher").OnEvent("Click", (*) => ExitApp())

MainGui.Show("w280 h300")

; -------------------------------------------------------------------
; FUNCTIONS
; -------------------------------------------------------------------

StartDevMode(*) {
    ; We add "title BACKEND &&" inside the cmd command. 
    ; This forces the tab to be renamed to "BACKEND" and "FRONTEND".
    
    command := 'wt.exe -w 0 new-tab --title "MyVCO Dev" -d "' backendDir '" cmd /k "title BACKEND && venv\Scripts\activate && uvicorn app.main:app --reload --port 8001" `; split-pane -V --title "FRONTEND" -d "' frontendDir '" cmd /k "title FRONTEND && npm run dev"'
    
    try {
        Run(command)
    } catch {
        MsgBox("Windows Terminal (wt.exe) not found!")
    }
}
KillAll(*) {
    ; Panic button to close everything if things get stuck
    RunWait("taskkill /F /IM uvicorn.exe /T",, "Hide")
    RunWait("taskkill /F /IM python.exe /T",, "Hide")
    RunWait("taskkill /F /IM node.exe /T",, "Hide")
    MsgBox("Processes Killed.")
}