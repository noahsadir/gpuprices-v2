# GPU Price Tracker

Track the price of Nvidia GPUs

![screenshot of gpu price tracker](http://github.com/noahsadir/gpuprices-v2/demo-img.png)

## Background

This tool was initially created to track the price of Nvidia cards during the price spike in 2020/21.

V1 of the web app was written two years ago and is somewhat crude and limited.

V2 is written in TypeScript and is intended to be more feature-filled.

### Methodology

A python script scans eBay auctions to approximate the market price of each graphics card.

The first page of soon-ending auction items is fetched every 15 minutes.

To avoid outliers, only the median 10 items are considered.

## DISCLAIMER

This is for educational purposes ONLY. I make no claim to accuracy of the data fetched and presented.

In fact, the nominal prices of the cards are most likely wrong due to the method used to fetch prices.

This tool is intended to analyze price trends rather than the prices themselves.
