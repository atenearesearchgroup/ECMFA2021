package com.apvereda.virtualbeacons;

import java.util.concurrent.atomic.AtomicInteger;

public class MyBeacon {

    static final AtomicInteger NEXT_ID = new AtomicInteger(0);
    final int id = NEXT_ID.getAndIncrement();
    public int getId(){
        return id;
    }

    public String URL;

    public int seenCounter = 2;

    public long interval;

    public boolean isActive = false;

    public double distance = -1;


    public MyBeacon(String URL){
        this.URL = URL;
    }

}
