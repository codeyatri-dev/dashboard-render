// import React, { useEffect, useState } from "react";
// import FullCalendar from "@fullcalendar/react";
// import dayGridPlugin from "@fullcalendar/daygrid";
// import interactionPlugin from "@fullcalendar/interaction";
// import axios from "axios";

// const CalendarPage = () => {
//   const [events, setEvents] = useState([]);

//   // Fetch events from backend
//   useEffect(() => {
//     axios.get("http://localhost:8000/api/calendar") // ✅ fixed endpoint
//       .then(res => {
//         const formattedEvents = res.data.events.map(event => ({
//           id: event.id,
//           title: event.summary,
//           start: event.start.dateTime || event.start.date,
//           end: event.end.dateTime || event.end.date,
//         }));
//         setEvents(formattedEvents);
//       })
//       .catch(err => console.error("Error fetching events:", err));
//   }, []);

//   // Handle adding new events by clicking a date
//   const handleDateClick = async (info) => {
//     const title = prompt("Enter event title:");
//     if (title) {
//       try {
//         const newEvent = {
//           summary: title,
//           start: { dateTime: info.dateStr },
//           end: { dateTime: info.dateStr },
//         };
//         const res = await axios.post("http://localhost:8000/events", newEvent);
//         setEvents([
//           ...events,
//           {
//             id: res.data.id,
//             title: res.data.summary,
//             start: res.data.start.dateTime || res.data.start.date,
//             end: res.data.end.dateTime || res.data.end.date,
//           },
//         ]);
//       } catch (err) {
//         console.error("Error adding event:", err);
//       }
//     }
//   };

//   return (
//     <div className="p-6">
//       <h2 className="text-xl font-bold mb-4">Google Calendar</h2>
//       <FullCalendar
//         plugins={[dayGridPlugin, interactionPlugin]}
//         initialView="dayGridMonth"
//         events={events}
//         dateClick={handleDateClick}
//         height="80vh"
//       />
//     </div>
//   );
// };

// export default CalendarPage;
