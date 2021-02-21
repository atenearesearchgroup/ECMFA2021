package com.apvereda.virtualbeacons;

import android.content.Context;

import com.couchbase.lite.android.AndroidContext;

import java.io.File;

/**
 * Created by apver on 13/02/2018.
 */

public class OwnAndroidContext extends AndroidContext {

    public OwnAndroidContext(Context wrappedContext) {
        super(wrappedContext);
    }

    @Override
    public File getFilesDir() {
        return new File("/sdcard/sl4a/couchbase");
    }
}
