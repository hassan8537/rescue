const defaultValues = {
  success: { code: 200, status: 1 },
  failed: { code: 400, status: 0 },
  error: { code: 500, status: 0 },
  unavailable: { code: 404, status: 0 },
  unauthorized: { code: 403, status: 1 }
};

function log({ type, object_type, code, status, message, data }) {
  console.info({ object_type, code, status, message, data });
}

function buildResponse(type) {
  const { code, status } = defaultValues[type];
  return ({ res, message, data = null, object_type = null }) => {
    log({ type, object_type, code, status, message, data });
    return res.status(code).send({ status, message, data });
  };
}

function buildLogger(type) {
  const { code, status } = defaultValues[type];
  return ({ object_type, message, data = null }) => {
    log({ type, object_type, code, status, message, data });
  };
}

function buildEvent(type) {
  const { code, status } = defaultValues[type];
  return ({ object_type, message, data = null }) => ({
    object_type,
    code,
    status,
    message,
    data
  });
}

const handlers = {
  logger: {
    success: buildLogger("success"),
    failed: buildLogger("failed"),
    error: buildLogger("error"),
    unavailable: buildLogger("unavailable"),
    unauthorized: buildLogger("unauthorized")
  },
  response: {
    success: buildResponse("success"),
    failed: buildResponse("failed"),
    error: buildResponse("error"),
    unavailable: buildResponse("unavailable"),
    unauthorized: buildResponse("unauthorized")
  },
  event: {
    success: buildEvent("success"),
    failed: buildEvent("failed"),
    error: buildEvent("error"),
    unavailable: buildEvent("unavailable"),
    unauthorized: buildEvent("unauthorized")
  }
};

module.exports = handlers;
