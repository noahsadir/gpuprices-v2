import React from 'react';
import './App.css';
import "@fontsource/lato";

import Container from 'react-bootstrap/Container';
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import Image from 'react-bootstrap/Image'
import ListGroup from 'react-bootstrap/ListGroup';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import ToggleButton from 'react-bootstrap/Button';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import { Moon, MoonFill } from 'react-bootstrap-icons';

var itemDisplayInfo: DisplayInfo  = require('./itemDisplayInfo.json');
var data: PriceData = require('./testdata-daily.json');

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

interface DisplayInfo {
  [key: string]: DisplayInfoItem;
}

interface DisplayInfoItem {
  name: string;
  company: string;
  msrp: number;
}

interface PriceData {
  [key: string]: PriceDataItem; // key = date (ms)
}

interface PriceDataItem {
  [key: string]: number; // key = gpu, value = price
}


function fetchPrices(start: number, interval: number) {
  // fetch prices
}

function App() {
  var [theme, setTheme]: [string, any] = React.useState("dark");
  console.log(itemDisplayInfo);

  return (
    <div className="App" data-theme={theme} style={{display: 'flex', flexFlow: 'column'}}>
      <Toolbar theme={theme} onThemeChange={(newTheme: string) => setTheme(newTheme)}/>
      <MainContent/>
    </div>
  );
}

function Toolbar(props: any) {
  return (
    <Navbar bg={props.theme} variant={props.theme} expand="lg" sticky="top" style={{flexGrow: 0}}>
      <Container fluid>
        <Navbar.Brand style={{fontWeight: 600}}>GPU Price Tracker</Navbar.Brand>
        <div>
          <Button variant={(props.theme == "light") ? "outline-primary" : "primary"} style={{maxHeight: 40, maxWidth: 40, minHeight: 40, minWidth: 40, padding: 4, marginRight: 8}} onClick={(e: any) => props.onThemeChange((props.theme == "light") ? "dark" : "light")}>
            {(props.theme == "light") ? <Moon/> : <MoonFill/>}
          </Button>
          <Button style={{maxHeight: 40, maxWidth: 40, minHeight: 40, minWidth: 40, padding: 4}} href="https://www.github.com/noahsadir/gpuprices-v2">
            <Image fluid src="github.png"/>
          </Button>
        </div>
      </Container>
    </Navbar>
  );
}

function MainContent(props: any) {
  var listItems: any[] = [];
  var [selectedListItem, setSelectedListItem]: [string, any] = React.useState("gtx 1050");
  var [dayCount, setDayCount] = React.useState(365);

  const handleListClick = (event: any) => {
    setSelectedListItem(event.currentTarget.value);
  };

  const handleIntervalChange = (value: number) => {
    console.log(value);
    setDayCount(value);
  }

  for (var item in itemDisplayInfo) {
    const isActive: boolean = (item === selectedListItem);
    listItems.push(
      <ListGroup.Item
        style={isActive ? {
          borderRadius: 8,
          marginBottom: 8
        } : {
          borderRadius: 8,
          marginBottom: 8,
          backgroundColor: 'var(--list-background)',
          color: 'var(--text-primary)',
          border: '1px solid',
          borderColor: 'var(--list-border)'
        }}
        key={item}
        as="button"
        value={item}
        onClick={handleListClick}
        active={isActive}
        action>
          <div>
            <div style={{margin: 0, fontSize: '18px'}}>{itemDisplayInfo[item].name}</div>
            <div style={{margin: 0, fontSize: '14px'}}>{"MSRP: $" + itemDisplayInfo[item].msrp}</div>
          </div>
        
      </ListGroup.Item>
    );
  }

  var prices: any[] = [];
  for (var dateMillis in data) {
    if (Number(dateMillis) >= (Date.now() - (86400000 * dayCount))) {
      prices.push({
        x: Number(dateMillis),
        y: data[dateMillis][selectedListItem]
      });
    }
  }

  var formattedData = {
    datasets: [
      {
        label: itemDisplayInfo[selectedListItem].name,
        showLine: true,
        data: prices,
        backgroundColor: 'royalblue',
        pointRadius: 1,
        borderColor: 'royalblue',
        fill: false,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {

    },
  };

  return (
    <div style={{display: 'flex', flexGrow: 1, flexBasis: 0}}>
      <div style={{flexGrow: 1, flexBasis: 1, display: 'flex', flexFlow: 'column'}}>
        <ListGroup style={{flexGrow: 1, flexBasis: 1, overflow: 'scroll', borderRadius: 0, padding: 8}}>
          {listItems}
        </ListGroup>
        <div style={{flexGrow: 0, flexBasis: 0}}/>
      </div>
      <div style={{flexGrow: 3, flexBasis: 3, display: 'flex', flexFlow: "column"}}>
        <div style={{flexGrow: 1, flexBasis: 1, display: 'flex'}}>
          <div style={{flex: "1 0 0", display: "flex", flexFlow: "column"}}>
            <div style={{flex: "1 0 0"}}/>
            <p style={{display: "block", writingMode: "vertical-rl",textAlign:"center",margin:0,padding:0,paddingBottom:24}}>{"Price (USD)"}</p>
            <div style={{flex: "1 0 0"}}/>
          </div>
          <div style={{overflow: "hidden", display: "flex", flexFlow: "column", flex: "100 0 0"}}>
            <div style={{flex: "1 0 0"}}/>
            <div style={{flex: "100 0 0", overflow: "hidden", borderRadius: 8}}>
              <Scatter options={options} data={formattedData}/>
            </div>
            <p style={{display: "block", margin:0,padding:0,textAlign:"center",height:24,lineHeight:"24px"}}>{"Date"}</p>
            <div style={{flex: "1 0 0"}}/>
          </div>
          <div style={{flex: "1 0 0"}}/>
        </div>
        <div style={{display: 'flex', margin: 8}}>
          <div style={{flexGrow: 1, flexBasis: 0}}></div>
          <div style={{display: 'flex', maxWidth: 400, flexGrow: 1}}>
            <SelectButton text="1D" value={1} selectedVal={dayCount} onClick={handleIntervalChange}/>
            <div style={{flexGrow: 1}}></div>
            <SelectButton text="1W" value={7} selectedVal={dayCount} onClick={handleIntervalChange}/>
            <div style={{flexGrow: 1}}></div>
            <SelectButton text="1M" value={30} selectedVal={dayCount} onClick={handleIntervalChange}/>
            <div style={{flexGrow: 1}}></div>
            <SelectButton text="3M" value={90} selectedVal={dayCount} onClick={handleIntervalChange}/>
            <div style={{flexGrow: 1}}></div>
            <SelectButton text="1Y" value={365} selectedVal={dayCount} onClick={handleIntervalChange}/>
            <div style={{flexGrow: 1}}></div>
            <SelectButton text="ALL" value={3650} selectedVal={dayCount} onClick={handleIntervalChange}/>
          </div>
          <div style={{flexGrow: 1, flexBasis: 0}}></div>
        </div>
      </div>
    </div>
  );
}

/**
 * Pseudo-toggle button because I can't get the bootstrap one working
 * @param props the component properties
 * @returns a SelectButton
 */
function SelectButton(props: any) {
  return (
    <Button
      style={props.style}
      variant={(props.selectedVal == props.value ? "primary" : "secondary")}
      value={props.value}
      onClick={(event: any) => props.onClick(event.target.value)}>
        {props.text}
      </Button>
  );
}

export default App;
