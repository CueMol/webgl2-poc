#pragma once

#include <nan.h>

namespace demo {

class GLProxyManager : public Nan::ObjectWrap
{
public:
    static NAN_MODULE_INIT(Init);

private:
    GLProxyManager() : bufsize_(0), bufid_(-1);
    ~GLProxyManager() = default;

    static NAN_METHOD(New);

    // static NAN_METHOD(GetValue);

    // Set manager object
    static NAN_METHOD(SetManager);

    // Initialization
    static NAN_METHOD(Init);

    // Render
    static NAN_METHOD(Render);

    // ctor ??
    static Nan::Persistent<v8::Function> constructor;

    int bufsize_;
    int bufid_;
    Nan::Persistent<v8::Object> mgr_;
};

}  // namespace demo
