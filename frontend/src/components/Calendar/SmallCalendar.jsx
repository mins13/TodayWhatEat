import React from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import "./SmallCalendar.css";
import { format } from "date-fns";

function SmallCalendar({ date, onDateChange, events = [], onDayDoubleClick }) {
    const handleMonthChange = ({ activeStartDate }) => {
        onDateChange(activeStartDate);
    };

    const handleClick = (value, e) => {
        if (e.detail === 2) {
            // 👈 더블클릭일 때만 실행
            const dateStr = format(value, "yyyy-MM-dd");
            onDayDoubleClick?.(dateStr);
        } else {
            onDateChange(value); // 기본 클릭 동작
        }
    };

    const hasEvent = (date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        return events.some((e) => e.date === dateStr);
    };

    return (
        <div className="small-calendar">
            <Calendar
                onClickDay={handleClick} // 커스텀 더블클릭 처리
                value={date}
                calendarType="gregory"
                locale="ko-KR"
                onActiveStartDateChange={handleMonthChange}
                tileContent={({ date, view }) =>
                    view === "month" && hasEvent(date) ? (
                        <div className="event-dot" />
                    ) : null
                }
            />
        </div>
    );
}

export default SmallCalendar;
