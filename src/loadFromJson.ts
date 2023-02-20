import { ConfigObject, ConfigValue } from './config';

/**
 * Load configuration settings from a JSON object.
 * @param json the JSON object to load
 */
export default function loadFromJson(json: ConfigValue) {
  return json as ConfigObject;
}
