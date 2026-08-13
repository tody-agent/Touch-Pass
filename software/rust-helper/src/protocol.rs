use serde_json::Value;

pub const ACTION_VERSION: u8 = 1;
pub const OP_TEXT: u8 = 1;
pub const OP_KEY: u8 = 2;

pub fn encode_action<F>(action: &Value, secret_resolver: F) -> Result<Vec<u8>, String>
where
    F: Fn(&str) -> Option<Vec<u8>>,
{
    let mut out = vec![ACTION_VERSION];
    let preset = action.get("preset").and_then(|v| v.as_str()).unwrap_or("enter");

    match preset {
        "password" => {
            let secret_ref = action.get("secret_ref").and_then(|v| v.as_str()).unwrap_or("");
            let secret = secret_resolver(secret_ref).unwrap_or_default();
            out.push(OP_TEXT);
            out.push(secret.len() as u8);
            out.extend_from_slice(&secret);
        }
        "enter" | _ => {
            out.push(OP_KEY);
            out.push(1); // KEY_ENTER code
        }
    }
    Ok(out)
}
