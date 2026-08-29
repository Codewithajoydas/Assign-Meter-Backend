const {DuckDBInstance} = require("@duckdb/node-api");

 const dbConnector = async () => {
  const startTime = process.hrtime.bigint();

  try {
    const db = await DuckDBInstance.create();
    const connection = await db.connect();

    const endTime = process.hrtime.bigint();

    const executionTime =
      Number(endTime - startTime) / 1_000_000_000;

    console.log(
      `Connected to DuckDB in ${executionTime.toFixed(2)} s`,
    );

    return connection;
  } catch (error) {
    const endTime = process.hrtime.bigint();

    const executionTime =
      Number(endTime - startTime) / 1_000_000_000;

    console.error(
      `Error connecting to DuckDB after ${executionTime.toFixed(2)} s:`,
      error,
    );

    throw error;
  }
};

module.exports = dbConnector;