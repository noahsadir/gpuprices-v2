## ebayprices-v2.py
##
## Created by Noah Sadir on 14 Nov 2023
##
## Estimate market value of items based on eBay auctions.
##
## Install dependencies: `pip install -r requirements.txt`
##
## Arguments
## -p/--path        (str)   Path of text file containing line-seaparated search queries
##                          (Default: `items.txt`)
## -i/--interval    (int)   Interval in minutes for fetching item prices (ignored if test)
##                          (Default: `15`)
## -t/--test        (bool)  Enable test mode which immediately fetches once
##                          (Default: `False`)
##
## MINIMUM SYNTAX: `python ebayprices-v2.py`
## FULL SYNTAX:    `python ebayprices-v2.py -p [ITEMS_TXT_PATH] -i [INTERVAL_MINS] -t [TEST_MODE]`
##

import requests
import argparse
import json
import os
import time
from bs4 import BeautifulSoup
import datetime
from dateutil import tz
from urllib import parse

ANSI_RESET = '\x1b[0m'
ANSI_RED = '\x1b[0;41m'
ANSI_YELLOW = '\x1b[0;43m'
ANSI_GREEN = '\x1b[0;42m'

# Set up command line arguments
parser = argparse.ArgumentParser(description='Retrieve prices of items on eBay')
parser.add_argument('-i', '--interval',default=15, type=int,help="Interval (in minutes) to scan prices")
parser.add_argument('-t', '--test',default=False, type=bool, help="Toggle test mode")
parser.add_argument('-p', '--path',default="items.txt", type=str, help="Path of text file containing line-seaparated search queries")
args = parser.parse_args()

def clearScreen():
    print("\033c")

# given a path to a txt file, read each line and convert to list
def getItemsToSearch(path: str) -> [str]:
    items: [str] = []
    # check if file exists
    if not os.path.isfile(path): 
        print(ANSI_RED + " ERROR " + ANSI_RESET, "`" + path + "`", "is not a valid path.")
        return None
    # attempt to open file
    try:
        file = open(path, 'r')
    except OSError:
        print(ANSI_RED + " ERROR " + ANSI_RESET, "Could not read items.")
        return None
    # read each line
    for line in file.readlines():
        items.append(line.strip())
    # ensure file contains at least some search terms
    if len(items) == 0:
        print(ANSI_RED + " ERROR " + ANSI_RESET, "File does not contain any search terms.")
        return None
    file.close()
    return items

def getUrlForSearchTerm(searchTerm: str) -> str:
    return 'https://www.ebay.com/sch/i.html?_nkw=' + parse.quote(searchTerm) + '&_sacat=0&LH_Auction=1&_sop=1'

# Using BeautifulSoup, convert HTML of auction prices to float array
def parseHtmlForPrices(soup: BeautifulSoup, minItems: int) -> [float]:
    prices = []
    for itemPriceElement in soup.find_all('span', attrs={'class': 's-item__price'}):
        if itemPriceElement.text is None:
            print(ANSI_YELLOW + " WARNING " + ANSI_RESET, "Null text encountered instead of item price.")
            continue
        try:
            price: float = float(itemPriceElement.text.replace("$", ""))
        except ValueError:
            print(ANSI_YELLOW + " WARNING " + ANSI_RESET, "Could not convert price value to float")
            continue
        prices.append(price)
    if len(prices) < minItems:
        print(ANSI_YELLOW + " WARNING " + ANSI_RESET, "Found", len(prices), "prices for item, which is less than", minItems)
        return None
    return prices

# Given a search term, return a list of eBay auction prices
def getPricesForSearchTerm(searchTerm: str) -> [float]:
    url: str = getUrlForSearchTerm(searchTerm)
    headers: {str: str} = {'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246"}
    try:
        response: requests.Response = requests.get(url, headers=headers)
    except requests.exceptions.RequestException:
        print(ANSI_YELLOW + " WARNING " + ANSI_RESET, "Query for `" + searchTerm + "` failed due to request error.")
        return None
    
    if response.status_code != 200:
        print(ANSI_YELLOW + " WARNING " + ANSI_RESET, "Query for `" + searchTerm + "` returned status", response.status_code)
        return None
    soup = BeautifulSoup(response.content, 'html.parser')
    return parseHtmlForPrices(soup, 10)

# Return estimated price given:
#
# prices:   [float] - the list of prices
# range:    float   - the middle percentage of values to take
# discard:  float   - the maximum amount to deviate from the mean (e.g. 2 -> discard vals <50% and >200%)
def estimatePrice(prices: [float], range: float, discard: float) -> float:
    if prices is None or range is None or discard is None:
        print(ANSI_YELLOW + " WARNING " + ANSI_RESET, "Null params passed into estimatePrice()")
        return None
    prices.sort()
    # calculate indexes for evaluation
    numPrices: int = len(prices)
    medianIndex: int = int(numPrices / 2)
    lowerIndex: int = medianIndex - int(numPrices * (range / 2))
    upperIndex: int = medianIndex + int(numPrices * (range / 2))
    # filter data points to evaluate
    median: float = prices[medianIndex]
    sortedPricesInRange: [float] = prices[lowerIndex:upperIndex]
    pricesToEval: [float] = []
    for price in sortedPricesInRange:
        if price < (median * (1 / discard)) or price > (median * discard): continue
        pricesToEval.append(price)
    if len(pricesToEval) == 0:
        print(ANSI_YELLOW + " WARNING " + ANSI_RESET, "All prices were filtered out. Data may have too many outliers or range is too tight.")
        return None
    return sum(pricesToEval) / len(pricesToEval)

# Given a list of search terms, get the estimated price of each term
# and return a dictionary of prices for each item
def getPricesForItems(items: [str]) -> {str: float}:
    result: {str: float} = {}
    for item in items:
        prices: [float] = getPricesForSearchTerm(item)
        time.sleep(3) # make sure we don't flood with queries all at once
        if prices is None: continue
        estimatedPrice: float = estimatePrice(prices, 0.68, 3)
        if estimatedPrice is None: continue
        result[item] = estimatedPrice
        print(item, ":", "$" + "{:.2f}".format(estimatedPrice))
    if len(result) == 0:
        print(ANSI_YELLOW + " WARNING " + ANSI_RESET, "Could not get price for any items.")
        return None
    return result

# Determine if current time is within scan interval
def shouldFetchNow(interval: int) -> bool:
    return (datetime.datetime.now().minute % interval == 0)

# Attempt to scan for prices.
#
# Return:
# 0 - If fetch shouldn't be performed right now
# 1 - If an error occurred during fetching
# 2 - If the fetch was performed successfully
def scan(items: [str], interval: int, testMode: bool) -> int:
    if not shouldFetchNow(interval) and not testMode: return 0
    timestamp: str = str(round(time.time() * 1000))
    clearScreen()
    print("Scanning for items")
    print("------------------")
    # should fetch now
    priceFetchResult: {str: float} = getPricesForItems(items)
    if priceFetchResult is None: return 1
    # fetch result is valid; we can save now
    os.makedirs(os.path.dirname("prices/" + timestamp + ".json"), exist_ok=True)
    # Write JSON string to file
    try:
        file = open("prices/" + timestamp + ".json", "w")
    except OSError:
        print(ANSI_YELLOW + " WARNING " + ANSI_RESET, "Could not write results to file.")
        return 1
    enclosedResult: {str: {str: float}} = {}
    enclosedResult[timestamp] = priceFetchResult
    json.dump(enclosedResult, file)
    file.close()
    return 2

# Return a UTC and localized clock time for when the
# next scan should be performed
def getNextScanTimeString(interval: int) -> str:
    from_zone = tz.tzutc()
    to_zone = tz.tzlocal()
    nextTime: datetime.datetime = datetime.datetime.utcnow()
    nextTime = nextTime.replace(tzinfo=from_zone)
    while (nextTime.minute % interval != 0):
        nextTime = nextTime + datetime.timedelta(minutes=1)
    nextTime = nextTime.replace(second=0)
    return nextTime.strftime("%H:%M:%S") + " UTC (" + nextTime.astimezone(to_zone).strftime("%H:%M") + " local)"

# Return a UTC and localized clock time for the current time
def getCurrentTimeString() -> str:
    from_zone = tz.tzutc()
    to_zone = tz.tzlocal()
    now: datetime.datetime = datetime.datetime.utcnow()
    now = now.replace(tzinfo=from_zone)
    return now.strftime("%H:%M:%S") + " UTC (" + now.astimezone(to_zone).strftime("%H:%M") + " local)"

# Start routine for scanning at regular intervals
def beginScheduledScans(items: [str], interval: int, path: str, testMode: bool):
    lastScanTime: str = "N/A"
    scanCount = 0
    success = 0
    failure = 0
    lastSucceded = None
    while True:
        # print scan metrics
        clearScreen()
        print("Waiting for next scheduled time...")
        print("----------------------------------")
        print("Scan interval: ", interval, "minutes")
        print("Last scan at:  ", lastScanTime)
        print("Current time:  ", getCurrentTimeString())
        print("Next scheduled:", getNextScanTimeString(interval))
        print("----------------------------------")
        print("Success rate: ", success, "/", scanCount)
        print("Failure rate: ", failure, "/", scanCount)
        print("Last attempt: ", "N/A" if lastSucceded is None else ("Success" if lastSucceded else "Failure"))
        time.sleep(1)
        # attempt to scan
        scanStartTime: str = getCurrentTimeString()
        scanStat = scan(items, interval, testMode)
        if scanStat == 0: continue # not time to scan yet
        # scan was performed; log metrics
        lastScanTime = scanStartTime
        scanCount += 1
        if scanStat == 2:
            # success
            lastSucceded = True
            success += 1
        else:
            # failure
            lastSucceded = False
            failure += 1
        # interval check is by the second, so delay to prevent
        # duplicate scans within the same minute
        time.sleep(60)

# Main entry point of script
def main(interval: int, path: str, testMode: bool):
    if interval is None or path is None or testMode is None:
        print(ANSI_RED + " ERROR " + ANSI_RESET, "Missing input arguments.")
        return
    items: [str] = getItemsToSearch(path)
    if items is None: exit()
    # if test mode, only run once and immediately
    if testMode:
        scan(items, interval, testMode)
        return
    # Normal mode; run indefinitely at scheduled interval
    beginScheduledScans(items, interval, path, testMode)

main(args.interval, args.path, args.test)