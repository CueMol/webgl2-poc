{
  "targets": [
    {
      "target_name": "my_extension",
      "sources": ["ccsrc/my_extension.cc", "ccsrc/my_object.cpp", "ccsrc/gl_proxy_manager.cpp"],
      "include_dirs" : ["<!(node -e \"require('nan')\")"]
    }
  ]
}
