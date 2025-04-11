import React, { useState, useRef } from "react";
import { format } from "date-fns";
import SmallCalendar from "../components/Calendar/SmallCalendar";
import ExpirationList from "../components/Calendar/ExpirationList";
import MemoPad from "../components/Calendar/MemoPad";
import CalendarMain from "../components/Calendar/CalendarMain";
import IngredientModal from "../components/Calendar/IngredientModal";
import IngredientListModal from "../components/Calendar/IngredientListModal";
import MyFridgeModal from "../components/Calendar/MyFridgeModal";

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
    const [selectedListDate, setSelectedListDate] = useState(null);
    const [isListModalOpen, setIsListModalOpen] = useState(false);
    const [selectedDateItems, setSelectedDateItems] = useState([]);
    // 상태 추가
    const [isFridgeOpen, setIsFridgeOpen] = useState(false);


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

    const handleDayDoubleClick = (dateStr) => {
        const filtered = events.filter((e) => e.date === dateStr);
        setSelectedDateItems(filtered);
        setSelectedListDate(dateStr);
        setIsListModalOpen(true);
    };

    // 유통기한 임박 재료 필터링 (5일 이내)
    const today = new Date();
    const nearExpiredItems = events
        .map((e) => {
            const diff = Math.ceil((new Date(e.expireDate) - today) / (1000 * 60 * 60 * 24));
            return {
                ...e,
                remainingDays: diff,
            };
        })
        .filter((item) => item.remainingDays >= 0 && item.remainingDays <= 5); // 임박한 재료만 필터링


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

    const handleDelete = (target) => {
        setEvents(prev =>
            prev.filter(e =>
                !(
                    e.title === target.title &&
                    e.purchaseDate === target.purchaseDate &&
                    e.expireDate === target.expireDate &&
                    e.count === target.count &&
                    e.unit === target.unit
                )
            )
        );
    };



    return (
        <div className="main-container">
            <div className="content-wrapper">
                <Header />
                <div className="calendar-page">
                    <div className="left-panel">
                        <SmallCalendar date={currentDate} onDateChange={handleDateChange}  events={events} onDayDoubleClick={handleDayDoubleClick}/>
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
                        <div className="my-fridge-button-wrapper">
                            <button className="my-fridge-button" onClick={() => setIsFridgeOpen(true)}>
                                나의 냉장고
                            </button>
                        </div>

                    </div>

                    {isModalOpen && (
                        <IngredientModal
                            date={selectedDate}
                            initialData={editTarget}
                            items={selectedDateItems}
                            onClose={() => setIsModalOpen(false)}
                            onSave={handleSave}
                            onDelete={handleDelete}
                        />
                    )}

                    {isListModalOpen && (
                        <IngredientListModal
                            date={selectedListDate}
                            items={selectedDateItems}
                            onClose={() => setIsListModalOpen(false)}
                        />
                    )}
                    {isFridgeOpen && (
                        <MyFridgeModal
                            events={events}
                            onClose={() => setIsFridgeOpen(false)}
                        />
                    )}


                </div>
                <Footer />
            </div>
        </div>
    );
}

export default Calendar;
