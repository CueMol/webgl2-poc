#pragma once

#include <nan.h>

namespace demo {
class MyObject : public Nan::ObjectWrap
{
public:
    static NAN_MODULE_INIT(Init);

private:
    explicit MyObject(double value = 0);
    ~MyObject();

    static NAN_METHOD(New);
    static NAN_METHOD(GetValue);

    // Set manager object
    static NAN_METHOD(SetManager);

    // Render
    static NAN_METHOD(Render);

    // ctor ??
    static Nan::Persistent<v8::Function> constructor;

    double value_;
    Nan::Persistent<v8::Object> mgr_;
};

}  // namespace demo
