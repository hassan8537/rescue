const userSchema = {
  populate: [
    {
      path: "fleetManagerId shopOwnerId"
    }
  ]
};

module.exports = userSchema;
