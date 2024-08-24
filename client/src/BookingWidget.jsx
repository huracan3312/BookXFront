import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useContext, useEffect, useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import axios from "axios";
import { Navigate } from "react-router-dom";
import { UserContext } from "./UserContext.jsx";

export default function BookingWidget({ place }) {
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [numberOfGuests, setNumberOfGuests] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [redirect, setRedirect] = useState('');
  const [occupiedDates, setOccupiedDates] = useState([]);
  const { user } = useContext(UserContext);

  useEffect(() => {
    if (user) {
      setName(user.name);
    }
  }, [user]);

  useEffect(() => {
    // Fetch occupied dates from the backend
    // Hacerlo cuando se abra el datepicker
    async function fetchOccupiedDates() {
      try {
        // const response = await axios.get('/occupied-dates', {
        //   params: {
        //     place: place._id.toString()
        //   }
        // });
        let response = [
          { "start": "2024-09-10T00:00:00Z", "end": "2024-09-15T00:00:00Z" },
          { "start": "2024-08-20T00:00:00Z", "end": "2024-08-25T00:00:00Z" }
        ];
        setOccupiedDates(response);
      } catch (error) {
        console.error('Error fetching occupied dates:', error);
      }
    }
    fetchOccupiedDates();
  }, [place._id]);

  let numberOfNights = 0;
  if (checkIn && checkOut) {
    numberOfNights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  }

  async function bookThisPlace() {
    if (!name || !phone) {
      alert("Please fill out your name and phone number.");
      return;
    }
  
    try {
      // Solicita solo las reservas relevantes al backend
      const response = await axios.get('/bookings', {
        params: {
          place: place._id.toString(),
          checkIn: checkIn.toString(),
          checkOut: checkOut.toString()
        }
      });
  
      const bookings = response.data;
  
      // Verificar disponibilidad (ahora solo reserva las fechas relevantes)
      if (bookings.length === 0) {
        if (numberOfGuests <= place.maxGuests) {
          const bookingResponse = await axios.post('/bookings', {
            checkIn, checkOut, numberOfGuests, name, phone,
            place: place._id,
            price: numberOfNights * place.price,
            guests: numberOfGuests,
          });
  
          const bookingId = bookingResponse.data._id;
          setRedirect(`/account/bookings/${bookingId}`);
        } else {
          alert("The number of guests exceeds the maximum of the room");
        }
      } else {
        alert("The room isn't available in the selected dates");
      }
    } catch (error) {
      alert('An error occurred while processing your booking.');
    }
  }
  
  if (redirect) {
    return <Navigate to={redirect} />;
  }

    // Convert the occupied dates to an array of date objects
    const isDateBlocked = date => {
      return occupiedDates.some(occupiedDate =>
        date >= new Date(occupiedDate.start) && date <= new Date(occupiedDate.end)
      );
    };
  

  return (
    <div className="widget bg-white shadow p-4 rounded-2xl">
      <div className="text-2xl text-center">
        Price: ${place.price} / per night
      </div>
      <div className="border rounded-2xl mt-4">
        <div className="flex">
          <div className="py-3 px-4 flex-1 min-w-[200px]">
            <label>Check in:</label>
            <DatePicker
              selected={checkIn}
              onChange={dates => {
                const [start, end] = dates;
                setCheckIn(start);
                setCheckOut(end);
              }}
              startDate={checkIn}
              endDate={checkOut}
              selectsRange
              minDate={new Date()}
              className="form-input"
              placeholderText="Select check-in date"
              filterDate={date => !isDateBlocked(date)}
            />
          </div>
          <div className="py-3 px-4 flex-1 min-w-[200px]">
            <label>Check out:</label>
            <DatePicker
              selected={checkOut}
              onChange={date => setCheckOut(date)}
              startDate={checkIn}
              endDate={checkOut}
              minDate={checkIn || new Date()}
              selectsEnd
              className="form-input"
              placeholderText="Select check-out date"
              filterDate={date => !isDateBlocked(date)}
            />
          </div>
        </div>
        <div className="py-3 px-4 border-t">
          <label>Number of guests:</label>
          <input
            type="number"
            value={numberOfGuests}
            onChange={ev => setNumberOfGuests(ev.target.value)}
          />
        </div>
        {numberOfNights > 0 && (
          <div className="py-3 px-4 border-t">
            <label>Your full name:</label>
            <input
              type="text"
              value={name}
              onChange={ev => setName(ev.target.value)}
            />
            <label>Phone number:</label>
            <input
              type="tel"
              value={phone}
              onChange={ev => setPhone(ev.target.value)}
            />
          </div>
        )}
      </div>
      <button onClick={bookThisPlace} className="primary mt-4">
        Book this place
        {numberOfNights > 0 && (
          <span> ${numberOfNights * place.price}</span>
        )}
      </button>
    </div>
  );
}