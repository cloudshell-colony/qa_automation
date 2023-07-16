variable "test_string" {
    type = string
}

variable "test_string_liquid" {
    type = string
}

variable "test_number" {
   type = number
   default = 3
}

variable "test_bool" {
    type = bool
    default = true
}

variable "test_list_string" {
    type = list(string)
}

variable "test_map_string" {
    type = map(string)
}

variable "test_map_string2" {
    type = map(string)
}

variable "test_map_string_default" {
    type = map(string)
    default = {
        key1 = "val1"
        key2 = "val2"
    }
}

variable "test_map_string_default2" {
    type = map(string)
    default = {
        "key1" : "val1",
        "key2" : "val2"
    }
}

variable "test_object" {
    type = object({
        key1 = string,
        key2 = number
    })
}

variable "test_tuple" {
    type = tuple([string, number, bool])
    default = ["a", 15, true]
}

variable "test_liquid" {
    type = string
}
