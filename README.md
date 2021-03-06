### Installation

Install from npm using:

`npm install db2pool --save`

In addition, to use this, you will need to create a **/credentials/** folder in the base of your project.  It will contain the necessary credentials to connect to a db2 database.  for example:

```
{
	"database": "dbname",
	"hostname": "db2.server.hostname.com",
	"username": "<userid>",
	"password": "<password>",
	"port": 50100,
	"protocol": "TCPIP",
	"security": "SSL",
	"sslCert": "your ssl cert.pem",
	"maxPoolSize": size,
	"other": ""
}
```

Also, the package expects the global variable `__basedir` to be defined to contain the base path of your project.

Alternatively, the necessary credentials to connect to db2 databases can be stored as a JSON string in the environment variable DBPOOL.  for example:

```
#!/bin/bash
DBPOOL='
{
        "dbname": {
                "database": "dbname",
                "hostname": "db2.server.hostname.com",
                "username": "<userid>",
                "password": "<password>",
                "port": 50100,
                "protocol": "TCPIP",
                "security": "SSL",
                "sslCert": "your ssl cert.pem",
                "maxPoolSize": size,
                "other": ""
        },
        "dbname": {
                "database": "dbname",
                "hostname": "db2.server.hostname.com",
                "username": "<userid>",
                "password": "<password>",
                "port": 50100,
                "protocol": "TCPIP",
                "security": "SSL",
                "sslCert": "your ssl cert.pem",
                "maxPoolSize": size,
                "other": ""
        }
}
'
export DBPOOL
```

This connection pool makes use of the `ibm_db` framework which utilizes the IBM DB2 ODBC driver under the covers.  While ODBC may not be the db connectivity method of choice, it is fully functional and works.  This is coded in such a fashion that if IBM releases an official DB2 driver for Node.js in the future, it would be relatively easy to swap in to replace the `ibm_db` framework.

### Usage

Instatiate your pool as follows:

`const pool = require('db2pool');`

#### getConnection(dbname) - obtain database connection from the pool

```
pool.getConnection(dbname)
	.then((connection) => {
		//use connection to access the db
	})
	.catch((failure) -> {
		console.log(failure);
	})
```

**returns** - ES6 Promise that resolves to a connection object or an error

#### query(connection, query string, query parameters)

```
pool.query(connection, "SELECT * FROM DB WHERE ABC = ?", ["value'"])
	.then((result) => {
		// do something with the query result
	})
	.catch((failure) => {
		console.log(failure);
	})
```

connection = connection obtained earlier from getConnection

query string = SQL query to run on DB2

query parameters = values that will be substituted by the the driver into the query ?'s

**returns** - ES6 Promise that resolves to the results of a query or and error

