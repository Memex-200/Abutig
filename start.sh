#!/bin/bash

echo "========================================"
echo "   نظام إدارة الشكاوى البلدية"
echo "========================================"
echo

echo "بدء تشغيل النظام..."
echo

echo "1. تشغيل الخادم الخلفي..."
cd server && npm start &
BACKEND_PID=$!

echo "2. انتظار 5 ثوانٍ..."
sleep 5

echo "3. تشغيل الواجهة الأمامية..."
cd .. && npm run dev &
FRONTEND_PID=$!

echo
echo "========================================"
echo "تم تشغيل النظام بنجاح!"
echo
echo "الواجهة الأمامية: http://localhost:5173"
echo "الخادم الخلفي: http://localhost:3001"
echo
echo "حسابات الإدارة:"
echo "- emanhassanmahmoud1@gmail.com / admin123"
echo "- karemelolary8@gmail.com / admin123"
echo "========================================"
echo

# Wait for user to press Ctrl+C
trap "echo 'إيقاف الخوادم...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait 