class FakeProvider:
    """Test double: returns queued responses in order and records every call."""

    def __init__(self, responses: list[dict | Exception]):
        self.responses = list(responses)
        self.calls: list[dict] = []

    async def complete_json(self, **kwargs) -> dict:
        self.calls.append(kwargs)
        out = self.responses.pop(0)
        if isinstance(out, Exception):
            raise out
        return out
