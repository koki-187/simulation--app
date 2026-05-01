@echo off
REM ローンチェッカー 金利自動更新 - タスクスケジューラ登録スクリプト
REM 管理者権限で実行してください

echo ============================================
echo  ローンチェッカー 金利自動更新スケジュール設定
echo ============================================

SET SCRIPT_PATH=C:\Users\reale\terass-sim\scripts\update-loan-rates.js
SET NODE_PATH=node

REM 毎月1日 09:00 に実行
schtasks /create /tn "TerassSim_LoanRates_1st" ^
  /tr "%NODE_PATH% %SCRIPT_PATH%" ^
  /sc monthly ^
  /d 1 ^
  /st 09:00 ^
  /f ^
  /rl highest

REM 毎月15日 09:00 に実行
schtasks /create /tn "TerassSim_LoanRates_15th" ^
  /tr "%NODE_PATH% %SCRIPT_PATH%" ^
  /sc monthly ^
  /d 15 ^
  /st 09:00 ^
  /f ^
  /rl highest

echo.
echo ✅ タスクスケジューラへの登録が完了しました
echo.
echo 登録されたタスク:
echo   - TerassSim_LoanRates_1st  (毎月 1日 09:00)
echo   - TerassSim_LoanRates_15th (毎月15日 09:00)
echo.
echo 確認方法: タスクスケジューラ を開いて確認してください
echo 手動実行: node C:\Users\reale\terass-sim\scripts\update-loan-rates.js
echo.
pause
