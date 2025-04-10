import React, { forwardRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import './CalendarMain.css';

const CalendarMain = forwardRef(({ currentDate, onDateClick, onEventClick, events }, ref) => {
    useEffect(() => {
        if (ref?.current) {
            const api = ref.current.getApi();
            api.gotoDate(currentDate); // ← 작은 달력과 연동
        }
    }, [currentDate, ref]);

    return (
        <div className="calendar-main">
            <FullCalendar
                ref={ref}
                plugins={[dayGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                initialDate={currentDate}
                headerToolbar={false}
                locale="ko"
                height="auto"
                dayMaxEventRows={2}
                events={events.map((e) => ({
                    title: e.title,
                    start: e.date,
                    color: e.color,
                    extendedProps: { ...e }, // 수정용 데이터 보존
                }))}
                dateClick={(info) => onDateClick(info.dateStr)}
                eventClick={(info) => onEventClick(info)}
            />
        </div>
    );
});

export default CalendarMain;
