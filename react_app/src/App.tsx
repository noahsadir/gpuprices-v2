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

import { Check, ArrowLeftShort, Moon, MoonFill } from 'react-bootstrap-icons';

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

interface ChartPoint {
  x: number;
  y: number;
}

interface DataSummary {
  low: number;
  high: number;
  earliest: number;
  latest: number;
  change: number;
  change_percent: number;
}

function App() {
  var [theme, setTheme]: [string, any] = React.useState("dark");
  var [didLoad, setDidLoad]: [boolean, any] = React.useState(false);
  var [didSelect, setDidSelect]: [boolean, any] = React.useState(false);
  console.log(itemDisplayInfo);

  fetchPrices(0, 21600000, (priceData?: PriceData) => {
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
  var [dayCount, setDayCount]: [number, any] = React.useState(365);
  var [approximateMissing, setApproximateMissing]: [boolean, any] = React.useState(true);

  var changeString: string = "+$0.00 (0.00%)";
  var changeColor: string = "#ff0000";

  var prices: ChartPoint[] = [];
  var priceDataset: PriceData = data;
  var priceSummary: DataSummary = {
    low: Infinity,
    high: 0,
    earliest: 0,
    latest: 0,
    change: 0,
    change_percent: 0
  };

  if (dayCount <= 30) {
    priceDataset = granularData;
  }
  
  prices = getMovingAverage(formatPriceData(priceDataset, selectedListItem, dayCount, 86400000, approximateMissing), 12);
  priceSummary = getPriceSummary(prices);

  if (priceSummary.change >= 0) {
    changeString = "+$" + priceSummary.change.toFixed(2) + " (+" + (priceSummary.change_percent * 100).toFixed(2) + "%)";
    changeColor = "#28a745";
  } else {
    changeString = "-$" + Math.abs(priceSummary.change).toFixed(2) + " (-" + (priceSummary.change_percent * 100).toFixed(2) + "%)";
    changeColor = "#dc3545";
  }

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
    animation: {
      duration: 0
    },
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
          <p style={{fontSize: 32, margin: 0, padding: 0}}>{"$" + (priceSummary.latest == undefined ? 0 : priceSummary.latest).toFixed(2)}</p>
          <p style={{fontSize: 16, margin: 0, padding: 0, color: changeColor}}>{changeString}</p>
          <div style={{display: 'flex', padding: 8}}>
            <div style={{flexGrow: 1}}></div>
            <Button variant={approximateMissing ? "primary" : "outline-primary"} style={{maxWidth: 256, flexGrow: 1, height: 40}} onClick={(e: any) => setApproximateMissing(!approximateMissing)}>
              <Check style={{display: (approximateMissing ? 'inline-block' : 'none'), width: 24, height: 24}}/> Approximate missing data
            </Button>
            <div style={{flexGrow: 1}}></div>
          </div>
          
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

function getPriceSummary(points: ChartPoint[]) {
  var result: DataSummary = {
    low: Infinity,
    high: 0,
    earliest: 0,
    latest: 0,
    change: 0,
    change_percent: 0
  };

  if (points.length > 0) {
    result.earliest = points[0].y;
    result.latest = points[points.length - 1].y;
    result.change = result.latest - result.earliest;
    if (result.change > 0) {
      result.change_percent = (result.latest / result.earliest) - 1;
    } else if (result.change < 0) {
      result.change_percent = 1 - (result.latest / result.earliest);
    } else {
      result.change_percent = 0;
    }
  }

  for (var point of points) {
    if (point.y < result.low) {
      result.low = point.y;
    }
    if (point.y > result.high) {
      result.high = point.y;
    }
  }

  return result;
}

function getMovingAverage(points: ChartPoint[], avgCount: number) {
  var movingArray: ChartPoint[] = [];
  var result: ChartPoint[] = [];
  
  // populate & rotate moving array
  for (var point of points) {
    movingArray.push(point);
    if (movingArray.length > avgCount) {
      movingArray.shift();
    }

    // get moving average at each point
    if (movingArray.length == avgCount) {
      var newPoint: ChartPoint = {
        x: movingArray[avgCount - 1].x,
        y: 0
      }

      for (var point of movingArray) {
        newPoint.y += point.y;
      }
      newPoint.y /= avgCount;
      result.push(newPoint);
    }
  }
  
  return result;
}

function formatPriceData(priceDataset: PriceData, selectedListItem: string, dayCount: number, interval: number, approximateMissing: boolean) {
  var prices: any = [];
  var previous: number = 0;
  var prevPrice: number = 0;
  for (var dateMillis in priceDataset) {
    if (Number(dateMillis) >= (Date.now() - (86400000 * dayCount))) {

      // Generate approximate values for missing data
      if (approximateMissing && previous != 0 && Number(dateMillis) - previous > (interval * 2)) {
        console.log("Found " + ((Number(dateMillis) - previous) * 60000) + " min gap");
        var priceDiff = priceDataset[dateMillis][selectedListItem] - prevPrice;
        var intervalsMissed = Math.floor((Number(dateMillis) - previous) / interval);
        priceDiff /= intervalsMissed;
        for (var i = 0; i < intervalsMissed; i++) {
          var randomNoise: number = getRandomInt(Math.abs((priceDiff / 2) * intervalsMissed) * -1, Math.abs((priceDiff / 2) * intervalsMissed));
          prices.push({
            x: previous + (interval * i),
            y: prevPrice + (priceDiff * i) + randomNoise
          });
        }
      }

      prices.push({
        x: Number(dateMillis),
        y: priceDataset[dateMillis][selectedListItem]
      });
      
      previous = Number(dateMillis);
      prevPrice = priceDataset[dateMillis][selectedListItem];
    }
  }
  return prices;
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

function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

export default App;
