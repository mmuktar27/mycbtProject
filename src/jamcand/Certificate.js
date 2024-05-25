import React from 'react';
import certlogo from '../resources/certlogo.jpg';
import { useLocation } from 'react-router-dom';
export default function Certificate() {
  const location = useLocation();

  const regNo = location.state && location.state.regNo;
  const cdate = location.state && location.state.cdate;
  const userinfo = location.state && location.state.userinFor.fullname;


  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <style type='text/css'>
        {`
          body, html {
            margin: 0;
            padding: 0;
          }
          body {
            color: black;
            font-family: Georgia, serif;
            font-size: 24px;
            text-align: center;
          }
          .container {
            width: 1010px;
            height: 563px;
            display: table-cell;
            vertical-align: middle;
            background-image: url(${certlogo});
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            position: relative;
          }
          .logo {
            color: #c0392b; /* Red color */
          }
          .marquee {
            color: #27ae60; /* Green color */
            font-size: 48px;
            margin: 20px;
          }
          .assignment {
            margin: 20px;
          }
          .person {
            border-bottom: 2px solid black;
            font-size: 32px;
            font-style: italic;
            margin: 20px auto;
            width: 400px;
          }
          .reason {
            margin: 20px;
          }

          @media print {
            body *:not(.container),
            body *:not(.container) * {
              display: none !important;
            }
          }
        `}
      </style>

      <div className="container">
        <div className="logo">
          TARSOFT SDN BHD
        </div>

        <div className="marquee">
          Certificate of Completion
        </div>

        <div className="assignment">
          This is to certify that
        </div>

        <div className="person">
          {userinfo} &nbsp; ({regNo})
        </div>

        <div className="reason">
          has successfully completed the Jamb CBT Training on this date:<br />
          {cdate}
        </div>
      </div>

      <button className="btn btn-success" onClick={handlePrint}>
        Print Certificate
      </button>
    </div>
  );
}
