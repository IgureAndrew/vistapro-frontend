import React, { useState, useEffect } from 'react';

function CountdownTimer({ deadline }) {
  // Function to calculate the time left until the deadline.
  const calculateTimeLeft = () => {
    const now = new Date();
    const targetDate = new Date(deadline);
    const difference = targetDate - now;
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / (1000 * 60)) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      };
    }
    return timeLeft;
  };

  // State to hold the current time left.
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  // Set up an interval to update the countdown every second.
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // Cleanup the interval when component unmounts.
    return () => clearInterval(timer);
  }, [deadline]);

  // Build countdown display components.
  const timerComponents = [];
  Object.keys(timeLeft).forEach(interval => {
    if (timeLeft[interval] !== undefined) {
      timerComponents.push(
        <span key={interval}>
          {timeLeft[interval]} {interval}{" "}
        </span>
      );
    }
  });

  // Display "Expired" if time is up.
  return (
    <div>
      {timerComponents.length ? timerComponents : <span>Expired</span>}
    </div>
  );
}

export default CountdownTimer;
