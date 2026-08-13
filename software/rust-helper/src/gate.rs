#[derive(Debug, PartialEq, Eq)]
pub enum GateDecision {
    Armed,
    Execute,
}

pub struct TriggerGate {
    pub window_seconds: f64,
    slot: Option<usize>,
    deadline: f64,
}

impl TriggerGate {
    pub fn new(window_seconds: f64) -> Self {
        Self { window_seconds, slot: None, deadline: 0.0 }
    }

    pub fn touch(&mut self, slot: usize, profile: &serde_json::Value, now: f64) -> GateDecision {
        let requires_confirmation = profile.get("confirm")
            .and_then(|v| v.as_bool())
            .unwrap_or_else(|| profile.get("preset").and_then(|v| v.as_str()) != Some("password"));

        if !requires_confirmation {
            self.slot = None;
            self.deadline = 0.0;
            return GateDecision::Execute;
        }

        if self.slot == Some(slot) && now <= self.deadline {
            self.slot = None;
            self.deadline = 0.0;
            return GateDecision::Execute;
        }

        self.slot = Some(slot);
        self.deadline = now + self.window_seconds;
        GateDecision::Armed
    }
}
