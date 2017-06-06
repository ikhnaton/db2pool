const _ = require('lodash');
const ibmdb = require('ibm_db');

function dbPool()
{
	var pool = {};
	var mi = this;

	this.getConnection = function(dbName)
	{
		var promise = new Promise((resolve, reject) =>
		{
			mi.init(dbName);
			var available = _.findIndex(pool[dbName].connections, { active: false });

			if ((available == -1) && (pool[dbName].connections.length < pool[dbName].maxPoolSize))
			{
				var config = (process.env.DBPOOL != null)?JSON.parse(process.env.DBPOOL)[dbName]:require(__basedir + 'credentials/' + dbName + '.json');

				ibmdb.open(_buildConectionString(config), function (err, conn)
				{
					if (err)
					{
						console.log(err);
						reject(err);
					}
					else
					{
						pool[dbName].counter++;
						pool[dbName].connections.push({ _connection: conn, active: false, id: pool[dbName].counter });
						var dex = _.findIndex(pool[dbName].connections, { id: pool[dbName].counter });
						resolve(pool[dbName].connections[dex]);
					}
				});
			}
			else if (available == -1)
			{
				// all connections are in use, start stacking.
				var x = Math.floor(Math.random() * pool[dbName].maxPoolSize);

				resolve(pool[dbName].connections[x]);
			}
			else
			{
				resolve(pool[dbName].connections[available]);
			}
		});

		return promise;
	}

	this.query = function(connection, queryString, bindingParameters)
	{
		var promise = new Promise((resolve, reject) =>
		{
//			console.log(new Date(), connection.id);
			connection.active = true;
			connection._connection.query(queryString, bindingParameters).then((result) => {
				connection.active = false;
				resolve(result);
			}, (error) => {
				console.log(error);
				connection.active = false;
				reject(error);
			});
		});

		return promise;
	};

	this.setPoolMax = function(dbName, size)
	{
		mi.init(dbName);
		pool[dbName].maxPoolSize = size;
	}

	this.setConnectionBusy = function(connection)
	{
		connection.busy = true;
	}

	this.setConnectionNotBusy = function(connection)
	{
		connection.busy = false;
	}

	this.init = function(dbName)
	{
		if (pool[dbName] == null)
		{
			pool[dbName] = {
				counter: 0,
				connections: []
			};

			if (process.env.DBPOOL)
			{
				let config = JSON.parse(process.env.DBPOOL);

				pool[dbName].maxPoolSize = (config[dbName].maxPoolSize != null)?config[dbName].maxPoolSize:10;
			}
			else
			{
				let config = require(__basedir + 'credentials/' + dbName + '.json');

				pool[dbName].maxPoolSize = (config.maxPoolSize != null)?config.maxPoolSize:10;
			}

		}
	}

	function _buildConectionString(json)
	{
		var conStr = "DATABASE=" + json.database;
		conStr += ";HOSTNAME=" + json.hostname;
		conStr += ";UID=" + json.username;
		conStr += ";PWD=" + json.password;
		conStr += ";PORT=" + json.port;
		conStr += ";PROTOCOL=" + json.protocol;
		conStr += ";Security=" + json.security;
		conStr += ";SSLServerCertificate=" + __basedir + "certificates/" + json.sslCert;
		conStr += (json.other != null)?";" + json.other:"";

		return conStr;
	}
}

module.exports = new dbPool();
