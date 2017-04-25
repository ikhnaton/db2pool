To use this, you will need to create a **/credentials/** folder in the base of your project.  It will contain the necessary credentials to connect to a db2 database.  for example, for the HPD database used in this demo:

```
{
	"database": "dbname",
	"hostname": "db2.server.hostname.com",
	"username": "<userid>",
	"password": "<password>",
	"port": 50602,
	"protocol": "TCPIP",
	"security": "SSL",
	"sslCert": "your ssl cert.pem",
	"other": ""
}
```

Also, the package expects the global variable `__basedir` to be defined to contain the base path of your project.

This connection pool makes use of the `ibm_db` framework which utilizes the IBM DB2 ODBC driver under the covers.  While ODBC may not be the db connectivity method of choice, it is fully functional and works.  This is coded in such a fashion that if IBM releases an official DB2 driver for Node.js in the future, it would be relatively easy to swap in to replace the `ibm_db` framework.

