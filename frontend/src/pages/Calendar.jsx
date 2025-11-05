// src/pages/Calendar.jsx (대충 이런 위치일 거라 가정)
// 경로는 프로젝트 구조에 맞게 조절해줘! ../api/http 가 맞는지만 한 번 확인

import React, { useState, useRef, useCallback, useEffect } from "react";
import { format } from "date-fns";
import SmallCalendar from "../components/Calendar/SmallCalendar";
import ExpirationList from "../components/Calendar/ExpirationList";
import MemoPad from "../components/Calendar/MemoPad";
import CalendarMain from "../components/Calendar/CalendarMain";
import IngredientModal from "../components/Calendar/IngredientModal";
import IngredientListModal from "../components/Calendar/IngredientListModal";
import MyFridgeModal from "../components/Calendar/MyFridgeModal";
import { http } from "../api/http";   // ✅ axios 대신 우리 공용 http 사용
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
    const lastCountRef = useRef({});
    const [listVersion, setListVersion] = useState(0);
    const [isFridgeOpen, setIsFridgeOpen] = useState(false);

    // localStorage에 초기 수량 저장해서 차수 구분
    const INITIAL_KEY = "fridgeInitialCounts";
    const getInitialCountMap = () => {
        try {
            return JSON.parse(localStorage.getItem(INITIAL_KEY)) || {};
        } catch {
            return {};
        }
    };
    const setInitialCountMap = (map) =>
        localStorage.setItem(INITIAL_KEY, JSON.stringify(map));

    // ✅ 여기서 이제 axios 말고 http 사용
    const fetchIngredients = useCallback(async () => {
        try {
            const res = await http.get("/api/fridge/list");
            const initialMap = getInitialCountMap();
            const lastCounts = lastCountRef.current;

            const fetched = res.data.map((item) => {
                const id = item.id;
                const current = Number(item.quantity);
                const key = `${id}:${item.purchaseDate}`; // 차수 구분
                const prevInit = initialMap[key];
                const prevCount = lastCounts[key];
                let nextInit;

                if (prevCount == null && prevInit == null) {
                    nextInit = current;
                } else if (prevCount != null && current > prevCount) {
                    const inc = current - prevCount;
                    nextInit = (prevInit ?? prevCount ?? 0) + inc;
                } else {
                    nextInit = prevInit ?? (prevCount ?? current);
                }

                initialMap[key] = nextInit;
                lastCounts[key] = current;

                const derivedStatus = current > 0 ? "ACTIVE" : "USED";
                const derivedUsedAt =
                    current > 0 ? null : item.usedAt ?? item.usedUpAt ?? null;
                const derivedUsedUpAt = current > 0 ? null : item.usedUpAt ?? null;

                return {
                    id,
                    title: item.ingredientName,
                    date: item.purchaseDate,
                    count: current,
                    unit: item.unit,
                    category: item.category,
                    purchaseDate: item.purchaseDate,
                    expireDate: item.expirationDate,
                    color: item.color,
                    memo: item.memo,
                    status: derivedStatus,
                    usedAt: derivedUsedAt,
                    usedUpAt: derivedUsedUpAt,
                    initialCount: nextInit,
                };
            });

            setInitialCountMap(initialMap);
            setEvents(fetched);
            setListVersion((v) => v + 1);
        } catch (err) {
            console.error("재료 불러오기 실패:", err);
        }
    }, []);

    useEffect(() => {
        if (isListModalOpen && selectedListDate) {
            const filtered = events.filter((e) => e.date === selectedListDate);
            setSelectedDateItems(filtered);
        }
    }, [events, isListModalOpen, selectedListDate]);

    useEffect(() => {
        fetchIngredients();
    }, [fetchIngredients]);

    useEffect(() => {
        const onFridgeDirty = () => fetchIngredients();
        window.addEventListener("fridge-dirty", onFridgeDirty);

        const onStorage = (e) => {
            if (e.key === "fridgeDirty") fetchIngredients();
        };
        window.addEventListener("storage", onStorage);

        const onVisible = () => {
            if (document.visibilityState === "visible") fetchIngredients();
        };
        document.addEventListener("visibilitychange", onVisible);

        return () => {
            window.removeEventListener("fridge-dirty", onFridgeDirty);
            window.removeEventListener("storage", onStorage);
            document.removeEventListener("visibilitychange", onVisible);
        };
    }, [fetchIngredients]);

    // ✅ 삭제도 http 사용, Authorization 헤더는 인터셉터가 자동 세팅
    const handleDelete = async (target) => {
        try {
            await http.delete("/api/fridge/delete", {
                data: {
                    ingredientName: target.title,
                    expirationDate: target.expireDate,
                },
            });
            await fetchIngredients();
            alert("재료가 삭제되었습니다!");
        } catch (err) {
            console.error("삭제 실패:", err);
            alert("삭제에 실패했습니다.");
        }
    };

    const handleDateChange = (date) => {
        setCurrentDate(date);
        if (calendarRef.current) {
            const api = calendarRef.current.getApi();
            api.gotoDate(date);
        }
    };

    const handleDateClick = (dateStr) => {
        setSelectedDate(dateStr);
        setEditTarget(null);
        setIsModalOpen(true);
    };

    const handleEventClick = (info) => {
        const id = info.event.id || info.event.extendedProps?.id;
        const found = events.find((e) => String(e.id) === String(id));
        setSelectedDate(info.event.startStr);
        setEditTarget(found || info.event.extendedProps || null);
        setIsModalOpen(true);
    };

    const handleDayDoubleClick = (dateStr) => {
        const filtered = events.filter((e) => e.date === dateStr);
        setSelectedDateItems(filtered);
        setSelectedListDate(dateStr);
        setIsListModalOpen(true);
    };

    const today = new Date();
    const nearExpiredItems = events
        .map((e) => {
            const diff = Math.ceil(
                (new Date(e.expireDate) - today) / (1000 * 60 * 60 * 24)
            );
            return {
                ...e,
                remainingDays: Number.isFinite(diff) ? diff : 9999,
            };
        })
        .filter(
            (item) =>
                item.remainingDays >= 0 &&
                item.remainingDays <= 5 &&
                Number(item.count) > 0
        );

    // ✅ 저장도 http 사용
    const handleSave = async (newEvent) => {
        if (
            !newEvent.title ||
            !newEvent.purchaseDate ||
            !newEvent.expireDate
        ) {
            alert("재료명, 구매일자, 유통기한은 필수 항목입니다!");
            return;
        }

        try {
            const nextQty = Number(newEvent.count);
            const payload = {
                id: editTarget?.id || null,
                ingredientName: newEvent.title,
                category: newEvent.category,
                quantity: nextQty,
                unit: newEvent.unit,
                purchaseDate: newEvent.purchaseDate,
                expirationDate: newEvent.expireDate,
                color: newEvent.color,
                memo: newEvent.memo,
                status: nextQty > 0 ? "ACTIVE" : "USED",
            };

            await http.post("/api/fridge/save", payload);
            await fetchIngredients();

            alert("재료가 저장되었습니다!");
        } catch (error) {
            console.error("재료 저장 실패:", error);
            alert("저장에 실패했습니다.");
        }

        setIsModalOpen(false);
        setEditTarget(null);
    };

    return (
        <div className="main-container">
            <div className="content-wrapper">
                <div className="calendar-page">
                    <div className="left-panel">
                        <SmallCalendar
                            date={currentDate}
                            onDateChange={handleDateChange}
                            events={events}
                            onDayDoubleClick={handleDayDoubleClick}
                        />
                        <ExpirationList items={nearExpiredItems} />
                        <MemoPad />
                    </div>

                    <div className="right-panel">
                        <h2 className="calendar-title">
                            📅 {format(currentDate, "yyyy년 M월")}
                        </h2>
                        <CalendarMain
                            currentDate={currentDate}
                            events={events}
                            onDateClick={handleDateClick}
                            onEventClick={handleEventClick}
                            ref={calendarRef}
                        />
                        <div className="my-fridge-button-wrapper">
                            <button
                                className="my-fridge-button"
                                onClick={() => setIsFridgeOpen(true)}
                            >
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
                            key={`list-${listVersion}-${selectedListDate || ""}`}
                            date={selectedListDate}
                            items={selectedDateItems}
                            version={listVersion}
                            onClose={() => setIsListModalOpen(false)}
                            onChange={async (type, payload) => {
                                if (
                                    ["consume", "restore"].includes(type) &&
                                    payload?.id != null &&
                                    payload?.newQuantity != null
                                ) {
                                    const q = Number(payload.newQuantity);
                                    setEvents((prev) =>
                                        prev.map((e) =>
                                            e.id === payload.id
                                                ? {
                                                    ...e,
                                                    count: q,
                                                    status:
                                                        q > 0
                                                            ? "ACTIVE"
                                                            : "USED",
                                                }
                                                : e
                                        )
                                    );
                                }
                            }}
                        />
                    )}

                    {isFridgeOpen && (
                        <MyFridgeModal
                            events={events.filter(
                                (e) => Number(e.count) > 0
                            )}
                            onClose={() => setIsFridgeOpen(false)}
                            onChange={async (type, payload) => {
                                if (
                                    payload?.id != null &&
                                    payload?.newQuantity != null
                                ) {
                                    const newQ = Number(payload.newQuantity);
                                    setEvents((prev) =>
                                        prev.map((e) =>
                                            e.id === payload.id
                                                ? {
                                                    ...e,
                                                    count: newQ,
                                                    status:
                                                        newQ > 0
                                                            ? "ACTIVE"
                                                            : "USED",
                                                }
                                                : e
                                        )
                                    );
                                }
                                await fetchIngredients();
                            }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default Calendar;
