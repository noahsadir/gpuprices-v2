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
import Spinner from 'react-bootstrap/Spinner';

import { ArrowLeftShort, Moon, MoonFill } from 'react-bootstrap-icons';

import {
  Chart as ChartJS,
  registerables
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

var itemDisplayInfo: DisplayInfo  = require('./itemDisplayInfo.json');
var data: PriceData = require('./testdata-daily.json');
var granularData: PriceData = require('./testdata-daily.json');

ChartJS.register(...registerables);

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

function App() {
  var [theme, setTheme]: [string, any] = React.useState("dark");
  var [didLoad, setDidLoad]: [boolean, any] = React.useState(false);
  var [didSelect, setDidSelect]: [boolean, any] = React.useState(false);
  console.log(itemDisplayInfo);

  fetchPrices(0, 86400000, (priceData?: PriceData) => {
    if (priceData != undefined) {
      data = priceData;
    }
    fetchPrices(Date.now() - (86400000 * 30), 900000, (granularPriceData?: PriceData) => {
      if (granularPriceData != undefined) {
        granularData = granularPriceData;
      }
      setDidLoad(true);
    });
  });

  const handleListSelect = () => {
    setDidSelect(true);
  }

  const handleBackClick = (e: any) => {
    setDidSelect(false);
  }

  return (
    <div className="App" data-theme={theme} style={{display: 'flex', flexFlow: 'column'}}>
      <Toolbar didSelect={didSelect} theme={theme} onBackClick={handleBackClick} onThemeChange={(newTheme: string) => setTheme(newTheme)}/>
      {didLoad ? (
        <MainContent onListSelect={handleListSelect} didSelect={didSelect}/>
      ) : (
        <div style={{display: 'flex', flexGrow: 1, flexBasis: 0}}>
          <div style={{display: 'flex', flexGrow: 1}}></div>
          <div style={{display: 'flex', flexGrow: 0, flexFlow: 'column'}}>
            <div style={{display: 'flex', flexGrow: 1}}></div>
            <div style={{display: 'flex', flexGrow: 0}}>
              <Spinner variant={(theme === "light") ? "primary" : "light"} animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
            <div style={{display: 'flex', flexGrow: 1}}></div>
          </div>
          <div style={{display: 'flex', flexGrow: 1}}></div>
        </div>
      )}
    </div>
  );
}

function Toolbar(props: any) {
  return (
    <Navbar bg={props.theme} variant={props.theme} expand="lg" sticky="top" style={{flexGrow: 0}}>
      <Container fluid>
        <div>
          <Button className={props.didSelect ? "back-button-visible" : "back-button-hidden"} variant={"primary"} style={{maxHeight: 40, maxWidth: 40, minHeight: 40, minWidth: 40, padding: 4, marginRight: 8}} onClick={props.onBackClick}>
            <ArrowLeftShort size={32}/>
          </Button>
          <Navbar.Brand style={{fontWeight: 600, height: 40}}>GPU Price Tracker</Navbar.Brand>
        </div>
        <div>
          <Button variant={(props.theme === "light") ? "outline-primary" : "primary"} style={{maxHeight: 40, maxWidth: 40, minHeight: 40, minWidth: 40, padding: 4, marginRight: 8}} onClick={(e: any) => props.onThemeChange((props.theme === "light") ? "dark" : "light")}>
            {(props.theme === "light") ? <Moon/> : <MoonFill/>}
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

  var latestPrice: number | undefined = undefined;
  var earliestPrice: number | undefined = undefined;
  var change: number = 1;
  var changeString: string = "+$0.00 (0.00%)";
  var changeColor: string = "#ff0000";

  const handleListClick = (event: any) => {
    props.onListSelect();
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
  var priceDataset: PriceData = data;
  if (dayCount <= 30) {
    priceDataset = granularData;
  }
  for (var dateMillis in priceDataset) {
    if (Number(dateMillis) >= (Date.now() - (86400000 * dayCount))) {
      if (earliestPrice == undefined) {
        earliestPrice = priceDataset[dateMillis][selectedListItem];
      }
      prices.push({
        x: Number(dateMillis),
        y: priceDataset[dateMillis][selectedListItem]
      });
      latestPrice = priceDataset[dateMillis][selectedListItem];
    }
  }

  if (earliestPrice != undefined && latestPrice != undefined) {
    change = latestPrice - earliestPrice;
    if (change >= 0) {
      changeString = "+$" + change.toFixed(2) + " (+" + (((latestPrice / earliestPrice) - 1) * 100).toFixed(2) + "%)";
      changeColor = "#28a745";
    } else {
      changeString = "-$" + Math.abs(change).toFixed(2) + " (-" + ((1 - (latestPrice / earliestPrice)) * 100).toFixed(2) + "%)";
      changeColor = "#dc3545";
    }
  }

  var formattedData = {
    datasets: [
      {
        label: itemDisplayInfo[selectedListItem].name,
        showLine: true,
        data: prices,
        backgroundColor: changeColor,
        pointRadius: 1,
        borderColor: changeColor,
        fill: false,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'month' as const
        }
      }
    },
  };

  return (
    <div style={{display: 'flex', flexGrow: 1, flexBasis: 0}}>
      <div className={props.didSelect ? "list-hidden" : "list-visible"} style={{flexGrow: 1, flexBasis: 1, display: 'flex', flexFlow: 'column'}}>
        <ListGroup style={{flexGrow: 1, flexBasis: 1, overflow: 'scroll', borderRadius: 0, padding: 8}}>
          {listItems}
        </ListGroup>
        <div style={{flexGrow: 0, flexBasis: 0}}/>
      </div>
      <div className={props.didSelect ? "list-visible" : "list-hidden"} style={{flexGrow: 3, flexBasis: 3, display: 'flex', flexFlow: "column"}}>
        <div style={{display: 'flex', flexFlow: "column", margin: 0, padding: 8}}>
          <p style={{fontSize: 28, fontWeight: 800, margin: 0, padding: 0}}>{itemDisplayInfo[selectedListItem].name}</p>
          <p style={{fontSize: 32, fontWeight: 800, margin: 0, padding: 0}}>{"$" + (latestPrice == undefined ? 0 : latestPrice).toFixed(2)}</p>
          <p style={{fontSize: 16, fontWeight: 800, margin: 0, padding: 0, color: changeColor}}>{changeString}</p>
        </div>
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
      variant={(props.selectedVal == props.value) ? "primary" : "secondary"}
      value={props.value}
      onClick={(event: any) => props.onClick(event.target.value)}>
        {props.text}
      </Button>
  );
}

function fetchPrices(start: number, interval: number, callback: (priceData?: PriceData) => void) {
  const url: string = "/public/fetch_prices.php?from=" + start + "&interval=" + interval;

  var config: any = {
    method: 'get'
  };

  var status: number = 400;

  fetch(url, config)
  .then((response: any) => {
    status = response.status;
    return response.json();
  })
  .then((data: any) => {
    if (status === 200) {
      if (data != null) {
        callback(data);
      } else {
        callback(undefined);
      }
    } else {
      callback(undefined);
    }
  })
  .catch((error: any) => {
    callback(undefined);
  });
}

export default App;
