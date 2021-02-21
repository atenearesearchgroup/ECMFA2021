package com.apvereda.virtualbeacons;

import androidx.appcompat.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import com.couchbase.lite.CouchbaseLiteException;
import com.couchbase.lite.Database;
import com.couchbase.lite.Document;
import com.couchbase.lite.Emitter;
import com.couchbase.lite.Manager;
import com.couchbase.lite.Mapper;
import com.couchbase.lite.QueryEnumerator;
import com.couchbase.lite.QueryRow;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

public class DBConsulting extends AppCompatActivity {

    Database database;
    OwnAndroidContext ctx;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_dbconsulting);
        // Create a manager
        Manager manager = null;
        try {
            ctx = new OwnAndroidContext(getApplicationContext());
            manager = new Manager(ctx, Manager.DEFAULT_OPTIONS);
        } catch (IOException e) {
            e.printStackTrace();
        }
        // Create or open the database named app
        database = null;
        try {
            database = manager.getDatabase("app");
        } catch (CouchbaseLiteException e) {
            e.printStackTrace();
        }

        Map<String, Object> properties = new HashMap<String, Object>();
        properties.put("type", "treasure");
        properties.put("content", "Prueba Android");
        // Create a new document
        Document document = database.createDocument();
        // Save the document to the database
        try {
            document.putProperties(properties);
        } catch (CouchbaseLiteException e) {
            e.printStackTrace();
        }

        Button querybtn = (Button)findViewById(R.id.querybtn);
        querybtn.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                TextView resulttxt = (TextView)findViewById(R.id.resulttxt);
                com.couchbase.lite.View listsView = database.getView("list/listsByName");
                if (listsView.getMap() == null) {
                    listsView.setMap(new Mapper() {
                        @Override
                        public void map(Map<String, Object> document, Emitter emitter) {
                            String type = (String) document.get("type");
                            if ("task-list".equals(type)) {
                                emitter.emit(document.get("type"), document.get("content"));
                            }
                        }
                    }, "1.0");
                }
                try {
                    QueryEnumerator result = listsView.createQuery().run();
                    while (result.hasNext()){
                        QueryRow temp =result.next();
                        resulttxt.append("\n" + ctx.getFilesDir() + ", " + temp.getValue());
                    }
                } catch (CouchbaseLiteException e) {
                    e.printStackTrace();
                }
            }
        });
    }
}
