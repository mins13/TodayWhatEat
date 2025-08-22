import React, { useState, useRef } from "react";
import { format } from "date-fns";
import { useEffect } from "react";
import SmallCalendar from "../components/Calendar/SmallCalendar";
import ExpirationList from "../components/Calendar/ExpirationList";
import MemoPad from "../components/Calendar/MemoPad";
import CalendarMain from "../components/Calendar/CalendarMain";
import IngredientModal from "../components/Calendar/IngredientModal";
import IngredientListModal from "../components/Calendar/IngredientListModal";
import MyFridgeModal from "../components/Calendar/MyFridgeModal";
import axios from "axios";
import "./Calendar.css";


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
    useEffect(() => {
        const fetchIngredients = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("/api/fridge/list", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                const fetchedEvents = res.data.map((item) => ({
                    id: item.id,
                    title: item.ingredientName,
                    date: item.purchaseDate,
                    count: item.quantity,
                    unit: item.unit,
                    category: item.category,
                    purchaseDate: item.purchaseDate,
                    expireDate: item.expirationDate,
                    color: item.color,
                    memo: item.memo
                }));

                setEvents(fetchedEvents);
            } catch (err) {
                console.error("재료 불러오기 실패:", err);
            }
        };

        fetchIngredients();
    }, []);

    const handleDelete = async (target) => {
        try {
            // 프론트에서 먼저 삭제
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

            // 백엔드에 삭제 요청 (expirationDate만 보내도 삭제되도록 백엔드 구성했잖아!)
            await axios.delete("/api/fridge/delete", {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                },
                data: {
                    ingredientName: target.title,
                    expirationDate: target.expireDate
                }
            });

            alert("재료가 삭제되었습니다!");
        } catch (err) {
            console.error("삭제 실패:", err);
            alert("삭제에 실패했습니다.");
        }
    };

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
    const handleSave = async (newEvent) => {
        if (!newEvent.title || !newEvent.purchaseDate || !newEvent.expireDate) {
            alert("재료명, 구매일자, 유통기한은 필수 항목입니다!");
            return;
        }

        try {
            let eventToSave = { ...newEvent };

            // 백엔드에 저장 (id 포함해서 보냄)
            const res = await axios.post("/api/fridge/save", {
                id: editTarget?.id || null,
                ingredientName: eventToSave.title,
                category: eventToSave.category,
                quantity: eventToSave.count.toString(),
                unit: eventToSave.unit,
                purchaseDate: eventToSave.purchaseDate,
                expirationDate: eventToSave.expireDate,
                color: eventToSave.color,
                memo: eventToSave.memo,
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`
                }
            });

            const saved = res.data; // 백엔드에서 리턴된 최종 저장 데이터

            const savedEvent = {
                id: saved.id,
                title: saved.ingredientName,
                count: saved.quantity,
                unit: saved.unit,
                category: saved.category,
                purchaseDate: saved.purchaseDate,
                expireDate: saved.expirationDate,
                date: saved.purchaseDate, // 🔥 여기 중요!
                color: saved.color,
                memo: saved.memo
            };

            if (editTarget && editTarget.id) {
                setEvents((prev) =>
                    prev.map((e) => e.id === editTarget.id ? savedEvent : e)
                );
            } else {
                setEvents((prev) => [...prev, savedEvent]);
            }

            alert("재료가 저장되었습니다!");
        } catch (error) {
            console.error("재료 저장 실패:", error);
            alert("저장에 실패했습니다.");
        }

        setIsModalOpen(false);
        setEditTarget(null);
    };

    const fetchIngredients = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("/api/fridge/list", {
                headers: { Authorization: `Bearer ${token}` }
            });

            const fetchedEvents = res.data
                // 백엔드가 usedUpAt(또는 remaining) 내려준다는 가정
                .filter((item) => !item.usedUpAt && Number(item.quantity) > 0)
                .map((item) => ({
                    id: item.id,
                    title: item.ingredientName,
                    date: item.purchaseDate,
                    count: Number(item.quantity),     // ← 항상 숫자로
                    unit: item.unit,
                    category: item.category,
                    purchaseDate: item.purchaseDate,
                    expireDate: item.expirationDate,
                    color: item.color,
                    memo: item.memo,
                    status: item.status,
                    usedAt: item.usedAt,
                    usedUpAt: item.usedUpAt || null,  // 표시용
                }));

            setEvents(fetchedEvents);
        } catch (err) {
            console.error("재료 불러오기 실패:", err);
        }
    };



    return (
        <div className="main-container">
            <div className="content-wrapper">
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

            </div>
        </div>
    );
}

export default Calendar;
