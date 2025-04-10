import React, { useState, useRef } from "react";
import { format } from "date-fns";
import SmallCalendar from "../components/Calendar/SmallCalendar";
import ExpirationList from "../components/Calendar/ExpirationList";
import MemoPad from "../components/Calendar/MemoPad";
import CalendarMain from "../components/Calendar/CalendarMain";
import IngredientModal from "../components/Calendar/IngredientModal";
import "./Calendar.css";
import Header from '../components/Header';
import Footer from '../components/Footer';

function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [events, setEvents] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const calendarRef = useRef(null);

    // 날짜 변경
    const handleDateChange = (date) => {
        setCurrentDate(date);
        if (calendarRef.current) {
            const api = calendarRef.current.getApi();
            api.gotoDate(date); // 달력 동기화
        }
    };

    // 날짜 클릭 시: 등록 모달
    const handleDateClick = (dateStr) => {
        setSelectedDate(dateStr);
        setEditTarget(null); // 새로 입력
        setIsModalOpen(true);
    };

    // 이벤트 클릭 시: 수정 모달
    const handleEventClick = (info) => {
        setSelectedDate(info.event.startStr);
        setEditTarget(info.event.extendedProps); // 기존 데이터 넘김
        setIsModalOpen(true);
    };

    // 유통기한 임박 재료 필터링 (5일 이내)
    const today = new Date();
    const nearExpiredItems = events
        .map((e) => {
            const diff = Math.ceil((today - new Date(e.expireDate)) / (1000 * 60 * 60 * 24));
            return {
                ...e,
                remainingDays: diff,
            };
        })
        .filter((item) => item.remainingDays >= 0 && item.remainingDays <= 5); // 임박한 재료만 필터링

    console.log("Near Expired Items:", nearExpiredItems);


    // 저장 (등록/수정)
    const handleSave = (newEvent) => {
        if (editTarget) {
            setEvents((prev) =>
                prev.map((e) =>
                    e.title === editTarget.title && e.date === editTarget.date ? newEvent : e
                )
            );
        } else {
            setEvents((prev) => [...prev, newEvent]);
        }

        setIsModalOpen(false);
        setEditTarget(null);
    };

    // 디버깅용: events 로그 확인
    console.log("Events:", events);

    return (
        <div className="main-container">
            <div className="content-wrapper">
                <Header />
                <div className="calendar-page">
                    <div className="left-panel">
                        <SmallCalendar date={currentDate} onDateChange={handleDateChange} />
                        <ExpirationList items={nearExpiredItems} /> {/* 유통기한 임박 재료 표시 */}
                        <MemoPad />
                    </div>

                    <div className="right-panel">
                        <h2 className="calendar-title">📅 {format(currentDate, "yyyy년 M월")}</h2>
                        <CalendarMain
                            currentDate={currentDate}
                            events={events}
                            onDateClick={handleDateClick}
                            onEventClick={handleEventClick}
                            ref={calendarRef}
                        />
                    </div>

                    {isModalOpen && (
                        <IngredientModal
                            date={selectedDate}
                            initialData={editTarget}
                            onClose={() => setIsModalOpen(false)}
                            onSave={handleSave}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default Calendar;
